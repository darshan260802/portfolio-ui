import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatApiError } from "@/lib/api-error";

interface SlugCheckResponse {
	available: boolean;
	reason: string | null;
}

const DEBOUNCE_MS = 400;

export function useSlugCheck(slug: string) {
	const [result, setResult] = useState<SlugCheckResponse | null>(null);
	const [checking, setChecking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!slug || slug.length < 3) {
			setResult(null);
			setError(null);
			return;
		}
		setChecking(true);
		setError(null);
		const timeout = setTimeout(() => {
			api
				.get<SlugCheckResponse>(`/api/slug/check?slug=${encodeURIComponent(slug)}`)
				.then(setResult)
				.catch((err: unknown) => {
					// Previously swallowed entirely (`.catch(() => setResult(null))`)
					// — a network hiccup made availability silently look
					// "unknown" with no way to tell that apart from "not checked
					// yet". Surface it so the UI can distinguish the two.
					setResult(null);
					setError(formatApiError(err));
				})
				.finally(() => setChecking(false));
		}, DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [slug]);

	return { result, checking, error };
}
