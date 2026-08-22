import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface SlugCheckResponse {
	available: boolean;
	reason: string | null;
}

const DEBOUNCE_MS = 400;

export function useSlugCheck(slug: string) {
	const [result, setResult] = useState<SlugCheckResponse | null>(null);
	const [checking, setChecking] = useState(false);

	useEffect(() => {
		if (!slug || slug.length < 3) {
			setResult(null);
			return;
		}
		setChecking(true);
		const timeout = setTimeout(() => {
			api
				.get<SlugCheckResponse>(`/api/slug/check?slug=${encodeURIComponent(slug)}`)
				.then(setResult)
				.catch(() => setResult(null))
				.finally(() => setChecking(false));
		}, DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [slug]);

	return { result, checking };
}
