import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Site {
	slug: string;
	templateId: string;
	status: "DRAFT" | "LIVE";
	url: string | null;
}

export function useSite() {
	const [site, setSite] = useState<Site | null | undefined>(undefined);

	useEffect(() => {
		api
			.get<{ site: Site | null }>("/api/me/site")
			.then((res) => setSite(res.site))
			.catch(() => setSite(null));
	}, []);

	return site; // undefined = loading, null = no site yet
}
