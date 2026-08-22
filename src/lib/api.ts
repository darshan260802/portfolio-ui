import { API_URL } from "./env";

export class ApiError extends Error {
	status: number;
	body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.status = status;
		this.body = body;
	}
}

/**
 * `credentials: "include"` is required on every call — that's what lets the
 * browser send the cross-subdomain session cookie set by the API. See the
 * design doc's "Resolved implementation mechanics" #12.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_URL}${path}`, {
		...init,
		credentials: "include",
		headers: {
			...(init?.body ? { "Content-Type": "application/json" } : {}),
			...init?.headers,
		},
	});

	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new ApiError(`Request to ${path} failed with ${res.status}`, res.status, body);
	}

	if (res.status === 204) return undefined as T;
	return res.json() as Promise<T>;
}

export const api = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, body?: unknown) =>
		request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
	put: <T>(path: string, body?: unknown) =>
		request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
	patch: <T>(path: string, body?: unknown) =>
		request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

/** For the ZIP download, which needs the raw Response (blob), not JSON. */
export async function apiDownload(path: string, body?: unknown): Promise<Response> {
	const res = await fetch(`${API_URL}${path}`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body ?? {}),
	});
	if (!res.ok) {
		const errBody = await res.json().catch(() => null);
		throw new ApiError(`Download from ${path} failed with ${res.status}`, res.status, errBody);
	}
	return res;
}
