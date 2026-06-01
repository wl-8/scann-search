import request from "./request"

export type UserResponse = {
  id: number
  username: string
  email: string
  role: string
  review_status: string
  account_status: string
  login_fail_count: number
}

export type UserListResponse = {
  total: number
  items: UserResponse[]
}

export function listUsers() {
  return request.get<UserListResponse>("/users")
}

export function listPendingUsers() {
  return request.get<UserListResponse>("/users/pending")
}

export function setUserRole(userId: number, role: string) {
  return request.put<UserResponse>(`/users/${userId}/role`, null, { params: { role } })
}

export function approveUser(userId: number) {
  return request.post<UserResponse>(`/users/${userId}/approve`)
}

export function rejectUser(userId: number) {
  return request.post<UserResponse>(`/users/${userId}/reject`)
}

export function banUser(userId: number) {
  return request.post<UserResponse>(`/users/${userId}/ban`)
}

export function unbanUser(userId: number) {
  return request.post<UserResponse>(`/users/${userId}/unban`)
}

export function deleteUser(userId: number) {
  return request.delete(`/users/${userId}`)
}

export default {
  listUsers,
  listPendingUsers,
  setUserRole,
  approveUser,
  rejectUser,
  banUser,
  unbanUser,
  deleteUser,
}
