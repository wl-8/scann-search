"""
认证与用户管理接口测试

覆盖场景：
  注册：成功 / 用户名重复 / 邮箱重复 / 密码格式非法
  登录：成功(管理员) / 密码错误 / 失败计数 + 自动锁定 / 待审核 / 审核拒绝 / 封禁
  /me：有效 token / 无 token / 过期 token
  用户管理：列表 / 待审核列表 / 审核通过 / 审核拒绝 / 修改角色 / 封禁 / 解封 / 删除
"""
import pytest
from tests.conftest import register, login, admin_token, auth_header


# ═══════════════════════════════════════════════════
#  注册
# ═══════════════════════════════════════════════════

def test_register_success(client):
    r = register(client)
    assert r.status_code == 201
    data = r.json()
    assert "user_id" in data


def test_register_duplicate_username(client):
    register(client, username="dup", email="a@example.com")
    r = register(client, username="dup", email="b@example.com")
    assert r.status_code == 409
    assert "用户名" in r.json()["detail"]


def test_register_duplicate_email(client):
    register(client, username="user1", email="same@example.com")
    r = register(client, username="user2", email="same@example.com")
    assert r.status_code == 409
    assert "邮箱" in r.json()["detail"]


def test_register_invalid_password(client):
    r = register(client, password="short")  # 太短且无大写/数字
    assert r.status_code == 422


def test_register_weak_password_no_upper(client):
    r = register(client, password="alllower1")  # 无大写
    assert r.status_code == 422


def test_register_invalid_username(client):
    r = register(client, username="a")  # 太短
    assert r.status_code == 422


# ═══════════════════════════════════════════════════
#  登录
# ═══════════════════════════════════════════════════

def test_login_admin_success(client):
    r = login(client)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    r = login(client, password="WrongPass@1")
    assert r.status_code == 401


def test_login_nonexistent_user(client):
    r = login(client, username="ghost", password="Test@1234")
    assert r.status_code == 401


def test_login_pending_review(client):
    register(client, username="pending_user", email="p@example.com")
    r = login(client, username="pending_user", password="Test@1234")
    assert r.status_code == 403
    assert "待审核" in r.json()["detail"]


def test_login_rejected(client):
    register(client, username="rejected_user", email="r@example.com")
    token = admin_token(client)
    # 获取用户 id
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "rejected_user")
    client.post(f"/api/users/{user_id}/reject", headers=auth_header(token))
    r = login(client, username="rejected_user", password="Test@1234")
    assert r.status_code == 403
    assert "未通过" in r.json()["detail"]


def test_login_banned(client):
    register(client, username="ban_user", email="ban@example.com")
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "ban_user")
    client.post(f"/api/users/{user_id}/approve", headers=auth_header(token))
    client.post(f"/api/users/{user_id}/ban", headers=auth_header(token))
    r = login(client, username="ban_user", password="Test@1234")
    assert r.status_code == 403
    assert "封禁" in r.json()["detail"]


def test_login_fail_count_increments(client):
    register(client, username="failcnt", email="fc@example.com")
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "failcnt")
    client.post(f"/api/users/{user_id}/approve", headers=auth_header(token))

    for _ in range(3):
        client.post("/api/auth/login", json={"username": "failcnt", "password": "WrongPass@1"})

    users_r2 = client.get("/api/users", headers=auth_header(token))
    user = next(u for u in users_r2.json()["items"] if u["username"] == "failcnt")
    assert user["login_fail_count"] == 3


def test_login_auto_lock_after_max_attempts(client):
    register(client, username="lockme", email="lock@example.com")
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "lockme")
    client.post(f"/api/users/{user_id}/approve", headers=auth_header(token))

    from app.auth.constants import MAX_LOGIN_ATTEMPTS
    for _ in range(MAX_LOGIN_ATTEMPTS):
        client.post("/api/auth/login", json={"username": "lockme", "password": "WrongPass@1"})

    # 下一次即使密码正确也应该被锁定
    r = login(client, username="lockme", password="Test@1234")
    assert r.status_code == 403
    assert "锁定" in r.json()["detail"]


# ═══════════════════════════════════════════════════
#  /me
# ═══════════════════════════════════════════════════

def test_get_me(client):
    token = admin_token(client)
    r = client.get("/api/auth/me", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["username"] == "admin"
    assert r.json()["role"] == "admin"


def test_get_me_no_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code in (401, 403)  # HTTPBearer 无凭据时返回 401/403（版本差异）


def test_get_me_invalid_token(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert r.status_code == 401


def test_logout(client):
    token = admin_token(client)
    r = client.post("/api/auth/logout", headers=auth_header(token))
    assert r.status_code == 204


# ═══════════════════════════════════════════════════
#  用户管理（管理员）
# ═══════════════════════════════════════════════════

def test_list_users_admin(client):
    token = admin_token(client)
    r = client.get("/api/users", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["total"] >= 1


def test_list_users_forbidden_for_normal(client):
    register(client)
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "testuser")
    client.post(f"/api/users/{user_id}/approve", headers=auth_header(token))

    user_token = login(client, username="testuser", password="Test@1234").json()["access_token"]
    r = client.get("/api/users", headers=auth_header(user_token))
    assert r.status_code == 403


def test_list_pending(client):
    register(client, username="pending1", email="p1@x.com")
    register(client, username="pending2", email="p2@x.com")
    token = admin_token(client)
    r = client.get("/api/users/pending", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["total"] == 2


def test_approve_user(client):
    register(client)
    token = admin_token(client)
    users_r = client.get("/api/users/pending", headers=auth_header(token))
    user_id = users_r.json()["items"][0]["id"]
    r = client.post(f"/api/users/{user_id}/approve", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["review_status"] == "approved"


def test_reject_user(client):
    register(client)
    token = admin_token(client)
    users_r = client.get("/api/users/pending", headers=auth_header(token))
    user_id = users_r.json()["items"][0]["id"]
    r = client.post(f"/api/users/{user_id}/reject", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["review_status"] == "rejected"


def test_set_role_to_researcher(client):
    register(client)
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "testuser")
    r = client.put(f"/api/users/{user_id}/role?role=researcher", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["role"] == "researcher"


def test_set_role_invalid(client):
    register(client)
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "testuser")
    r = client.put(f"/api/users/{user_id}/role?role=superuser", headers=auth_header(token))
    assert r.status_code == 400


def test_ban_and_unban(client):
    register(client)
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "testuser")

    # 审核通过再封禁
    client.post(f"/api/users/{user_id}/approve", headers=auth_header(token))
    r = client.post(f"/api/users/{user_id}/ban", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["account_status"] == "banned"

    r2 = client.post(f"/api/users/{user_id}/unban", headers=auth_header(token))
    assert r2.status_code == 200
    assert r2.json()["account_status"] == "normal"


def test_cannot_ban_admin(client):
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    admin_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "admin")
    r = client.post(f"/api/users/{admin_id}/ban", headers=auth_header(token))
    assert r.status_code == 403


def test_delete_user(client):
    register(client)
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "testuser")
    r = client.delete(f"/api/users/{user_id}", headers=auth_header(token))
    assert r.status_code == 204


def test_delete_admin_forbidden(client):
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    admin_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "admin")
    r = client.delete(f"/api/users/{admin_id}", headers=auth_header(token))
    assert r.status_code == 403


def test_update_me_password(client):
    register(client)
    token = admin_token(client)
    users_r = client.get("/api/users", headers=auth_header(token))
    user_id = next(u["id"] for u in users_r.json()["items"] if u["username"] == "testuser")
    client.post(f"/api/users/{user_id}/approve", headers=auth_header(token))

    user_token = login(client, username="testuser", password="Test@1234").json()["access_token"]
    r = client.put(
        "/api/users/me",
        json={"password": "NewPass@5678"},
        headers=auth_header(user_token),
    )
    assert r.status_code == 200

    # 用新密码登录
    r2 = login(client, username="testuser", password="NewPass@5678")
    assert r2.status_code == 200


def test_user_404(client):
    token = admin_token(client)
    r = client.post("/api/users/9999/approve", headers=auth_header(token))
    assert r.status_code == 404
