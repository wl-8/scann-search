import request from "./request";
export function listUsers() {
    return request.get("/users");
}
export function listPendingUsers() {
    return request.get("/users/pending");
}
export function setUserRole(userId, role) {
    return request.put(`/users/${userId}/role`, null, { params: { role } });
}
export function approveUser(userId) {
    return request.post(`/users/${userId}/approve`);
}
export function rejectUser(userId) {
    return request.post(`/users/${userId}/reject`);
}
export function banUser(userId) {
    return request.post(`/users/${userId}/ban`);
}
export function unbanUser(userId) {
    return request.post(`/users/${userId}/unban`);
}
export function deleteUser(userId) {
    return request.delete(`/users/${userId}`);
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
};
