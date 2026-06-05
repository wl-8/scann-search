// POST /auth/register, /auth/login, /auth/logout, /auth/me
import request from "./request"

export type LoginPayload = { username: string; password: string }

export type TokenResponse = { access_token: string; token_type?: string }
export type CurrentUser = { id: number; username: string; role: string; email?: string }

export function login(payload: LoginPayload) {
	// calls backend /auth/login which returns TokenResponse
	return request.post("/auth/login", payload) as Promise<TokenResponse>
}

export function logout() {
	// backend expects POST /auth/logout (204)
	return request.post("/auth/logout")
}

export function me() {
	return request.get("/auth/me") as Promise<CurrentUser>
}

export function register(payload: { username: string; email: string; password: string }) {
	return request.post("/auth/register", payload)
}
