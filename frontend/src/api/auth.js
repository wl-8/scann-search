// POST /auth/register, /auth/login, /auth/logout, /auth/me
import request from "./request";
export function login(payload) {
    // calls backend /auth/login which returns TokenResponse
    return request.post("/auth/login", payload);
}
export function logout() {
    // backend expects POST /auth/logout (204)
    return request.post("/auth/logout");
}
export function me() {
    return request.get("/auth/me");
}
export function register(payload) {
    return request.post("/auth/register", payload);
}
