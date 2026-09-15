import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Where the published HTML comes from — our template, or the user's own repo. */
export type SiteSource = "TEMPLATE" | "GIT";

/**
 * A site's "build from my own repository" config as the API reports it.
 *
 * `envKeys` and not the values: the API never sends a stored environment
 * variable back, so the settings form shows which variables exist and lets
 * you replace one, but can't show you what it currently is. See
 * portfolio-builder-api's site-source.service.ts.
 */
export interface GitSource {
	repoUrl: string;
	branch: string | null;
	installCommand: string;
	buildCommand: string;
	buildDir: string;
	envKeys: string[];
}

export interface Site {
	slug: string;
	source: SiteSource;
	/** null for a repo-backed site that never picked a template. */
	templateId: string | null;
	status: "DRAFT" | "LIVE";
	url: string | null;
	/** Present whenever a repo config is on file — even while `source` is TEMPLATE. */
	git: GitSource | null;
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
