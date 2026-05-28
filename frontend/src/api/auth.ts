// POST /auth/register, /auth/login, /auth/logout, /auth/me
import request from "./request"

export type LoginPayload = { username: string; password: string }

export type TokenResponse = { access_token: string; token_type?: string }

export function login(payload: LoginPayload) {
	// calls backend /auth/login which returns TokenResponse
	return request.post<TokenResponse>("/auth/login", payload)
}

export function logout() {
	// backend expects POST /auth/logout (204)
	return request.post("/auth/logout")
}

export function me() {
	return request.get("/auth/me")
}

export function register(payload: { username: string; email: string; password: string }) {
	return request.post("/auth/register", payload)
}
