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
	delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/**
 * Uploads one file as multipart and reports progress.
 *
 * XHR rather than `fetch` for one reason: `fetch` has no upload-progress
 * event. These files run to 5 MB, which is several seconds on a phone, and a
 * button that just sits there for that long reads as broken. `withCredentials`
 * is the XHR spelling of `credentials: "include"` — without it the session
 * cookie doesn't cross to the API subdomain and every upload is a 401.
 *
 * The abort handle lets a caller cancel an in-flight upload when the user
 * picks a different file or leaves the step.
 */
export interface Upload<T> {
	done: Promise<T>;
	abort: () => void;
}

export function apiUpload<T>(
	path: string,
	file: File,
	onProgress?: (fraction: number) => void,
): Upload<T> {
	const xhr = new XMLHttpRequest();
	const body = new FormData();
	body.append("file", file);

	const done = new Promise<T>((resolve, reject) => {
		xhr.open("POST", `${API_URL}${path}`);
		xhr.withCredentials = true;
		// Never set Content-Type by hand here — the browser has to append the
		// multipart boundary, and an explicit header overwrites it.

		xhr.upload.addEventListener("progress", (event) => {
			if (event.lengthComputable) onProgress?.(event.loaded / event.total);
		});

		xhr.addEventListener("load", () => {
			const parsed = parseJson(xhr.responseText);
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(parsed as T);
				return;
			}
			reject(new ApiError(`Upload to ${path} failed with ${xhr.status}`, xhr.status, parsed));
		});

		// A network failure and an abort both land here with status 0; only the
		// former should read as something going wrong.
		xhr.addEventListener("error", () => {
			reject(new TypeError("Failed to fetch"));
		});
		xhr.addEventListener("abort", () => {
			reject(new UploadAborted());
		});

		xhr.send(body);
	});

	return { done, abort: () => xhr.abort() };
}

/** Thrown when a caller cancels an upload — never worth showing to the user. */
export class UploadAborted extends Error {
	constructor() {
		super("Upload aborted");
		this.name = "UploadAborted";
	}
}

function parseJson(text: string): unknown {
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return null;
	}
}

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
