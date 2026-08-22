import { useEffect, useState } from "react";
import type { TemplateManifest } from "@pb/templates";
import { api } from "@/lib/api";

interface TemplatesResponse {
	templates: TemplateManifest[];
}

export function useTemplates() {
	const [templates, setTemplates] = useState<TemplateManifest[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		api
			.get<TemplatesResponse>("/api/templates")
			.then((res) => {
				if (!cancelled) setTemplates(res.templates);
			})
			.catch((err: Error) => {
				if (!cancelled) setError(err.message);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return { templates, error };
}
