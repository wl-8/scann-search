// 为了本地演示，提供一个不依赖后端的假登录实现
export function login(payload) {
    // Normally you'd call: return request.post('/auth/login', payload)
    // Here we return a resolved promise with a fake token and user info
    return Promise.resolve({
        token: "dev-token",
        user: { id: 1, username: payload.username, role: "researcher" },
    });
}
export function logout() {
    // Normally: return request.post('/auth/logout')
    return Promise.resolve({});
}
export function register(payload) {
    // Placeholder for register flow
    return Promise.resolve({ success: true });
}
