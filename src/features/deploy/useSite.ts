import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Site {
	slug: string;
	templateId: string;
	status: "DRAFT" | "LIVE";
	url: string | null;
}

/**
 * The account's single hosted site (the API enforces one per user — see
 * portfolio-builder-api's Site.userId unique constraint).
 *
 * `enabled: false` skips the request entirely and reports "no site", for
 * callers on pages a logged-out visitor can reach (the template detail
 * page). /api/me/site requires auth, so fetching it unconditionally there
 * would fire a guaranteed 401 on every anonymous page view.
 */
export function useSite({ enabled = true }: { enabled?: boolean } = {}) {
	const [site, setSite] = useState<Site | null | undefined>(undefined);

	const refresh = useCallback(() => {
		if (!enabled) {
			setSite(null);
			return Promise.resolve();
		}
		return api
			.get<{ site: Site | null }>("/api/me/site")
			.then((res) => setSite(res.site))
			.catch(() => setSite(null));
	}, [enabled]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	// undefined = loading, null = no site yet. `refresh` lets a caller pull
	// the latest server state after an action that changes it server-side
	// (e.g. switching templates) — this hook only fetches once on mount
	// otherwise, so without calling refresh() the UI would keep showing
	// the pre-change state until a full page reload.
	return { site, refresh };
}
