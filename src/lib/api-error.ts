import { ApiError } from "./api";

/**
 * Turns whatever the API throws into copy a user can read. Previously this
 * logic existed once, inline, in SettingsPage.tsx — every other call site
 * (the wizard, deploy, uploads, slug rename) either showed nothing or a
 * generic "Something went wrong." This is now the one place that
 * understands the API's error body shape (see portfolio-builder-api's
 * lib/zod-error.ts and the per-route `message`/`fields`/`reason` bodies).
 */
interface ApiErrorBody {
	error?: string;
	message?: string;
	reason?: string;
	fields?: Record<string, string>;
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
	return typeof body === "object" && body !== null;
}

const SLUG_REASON_MESSAGES: Record<string, string> = {
	taken: "That subdomain is already taken.",
	reserved: "That subdomain is reserved and can't be used.",
	too_short: "Subdomain must be at least 3 characters.",
	too_long: "Subdomain must be 63 characters or fewer.",
	invalid_format: "Subdomain can only contain lowercase letters, numbers, and hyphens (not at the start or end).",
	punycode_like: "Subdomain can't use that character pattern.",
};

/** Maps a slug validation `reason` code (from /api/slug/check or a 4xx slug error) to readable text. */
export function slugReasonMessage(reason: string | null | undefined): string | null {
	if (!reason) return null;
	return SLUG_REASON_MESSAGES[reason] ?? "Not a valid subdomain.";
}

/** The main human-readable summary for a toast title / inline banner. */
export function formatApiError(err: unknown): string {
	if (err instanceof ApiError) {
		if (isApiErrorBody(err.body)) {
			const body = err.body;
			if (body.message) return body.message;
			if (body.reason) {
				const mapped = slugReasonMessage(body.reason);
				if (mapped) return mapped;
			}
			if (body.error) return humanizeErrorCode(body.error);
		}
		if (err.status === 401) return "Please log in again.";
		if (err.status >= 500) return "Something went wrong on our end. Please try again.";
		return "That didn't work. Please check your input and try again.";
	}
	// A bare `fetch()` throws a plain TypeError ("Failed to fetch" / "Load
	// failed" depending on browser) when it can't reach the server at all —
	// offline, DNS failure, the API being down. That raw message isn't
	// something a user should have to parse, so it gets its own copy rather
	// than falling through to `err.message`.
	if (err instanceof TypeError) {
		return "Can't reach the server. Check your connection and try again.";
	}
	if (err instanceof Error) return err.message || "Something went wrong.";
	return "Something went wrong.";
}

/** Per-field messages, when the API returned one (e.g. wizard/profile validation). */
export function apiErrorFields(err: unknown): Record<string, string> | undefined {
	if (err instanceof ApiError && isApiErrorBody(err.body) && err.body.fields) {
		return err.body.fields;
	}
	return undefined;
}

function humanizeErrorCode(code: string): string {
	switch (code) {
		case "unauthorized":
			return "Please log in again.";
		case "no_profile":
			return "Fill in your portfolio details first.";
		case "no_template":
			return "Choose a template first.";
		case "no_site":
			return "You don't have a portfolio yet.";
		case "unknown_template":
			return "That template isn't available.";
		case "slug_required":
			return "Choose a subdomain first.";
		default:
			return code.replaceAll("_", " ");
	}
}
