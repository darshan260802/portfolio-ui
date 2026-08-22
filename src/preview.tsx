import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { emptyPortfolioData, type PortfolioData } from "@pb/templates";
import { TEMPLATE_LOADERS, type TemplateComponent } from "@pb/templates/loaders";
import "./preview.css";

/**
 * The ONLY file in this app allowed to import "@pb/templates/loaders" —
 * that's what keeps template code (and its global CSS) out of the builder
 * bundle. This entry is loaded in an <iframe src="/preview.html?template=…">
 * by the wizard/gallery, never mounted directly in the main app. See the
 * design doc's "Resolved implementation mechanics" #13.
 */

function getTemplateId(): string | null {
	return new URLSearchParams(window.location.search).get("template");
}

interface PbDataMessage {
	type: "pb:data";
	data: PortfolioData;
}

function isPbDataMessage(value: unknown): value is PbDataMessage {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { type?: unknown }).type === "pb:data"
	);
}

function PreviewApp({ templateId }: { templateId: string }) {
	const [Template, setTemplate] = useState<TemplateComponent | null>(null);
	const [data, setData] = useState<PortfolioData>(emptyPortfolioData);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		const loader = TEMPLATE_LOADERS[templateId];
		if (!loader) {
			setLoadError(`Unknown template "${templateId}"`);
			return;
		}
		let cancelled = false;
		loader()
			.then((mod) => {
				if (!cancelled) setTemplate(() => mod.default);
			})
			.catch((err: Error) => {
				if (!cancelled) setLoadError(err.message);
			});
		return () => {
			cancelled = true;
		};
	}, [templateId]);

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== window.location.origin) return;
			if (isPbDataMessage(event.data)) setData(event.data.data);
		}
		window.addEventListener("message", handleMessage);

		// Iframe speaks first: the parent never posts before seeing this, and
		// re-announces on every load so a navigation/HMR reload self-heals
		// without the parent having to track our load state.
		window.parent.postMessage({ type: "pb:ready", template: templateId }, window.location.origin);

		return () => window.removeEventListener("message", handleMessage);
	}, [templateId]);

	if (loadError) return <div className="preview-message preview-message--error">{loadError}</div>;
	if (!Template) return null;
	return <Template data={data} />;
}

const templateId = getTemplateId();
const rootEl = document.getElementById("preview-root");
if (!rootEl) throw new Error("Root element #preview-root not found");

createRoot(rootEl).render(
	<StrictMode>
		{templateId ? (
			<PreviewApp templateId={templateId} />
		) : (
			<div className="preview-message">Missing ?template= query parameter.</div>
		)}
	</StrictMode>,
);
