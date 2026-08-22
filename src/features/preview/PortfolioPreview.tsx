import { useEffect, useRef } from "react";
import type { PortfolioData } from "@pb/templates";
import { cn } from "@/lib/utils";

interface PortfolioPreviewProps {
	templateId: string;
	data: PortfolioData;
	className?: string;
}

/**
 * The parent side of the preview protocol (src/preview.tsx is the iframe
 * side). Never posts before the iframe's "pb:ready", and always sends the
 * LATEST draft (via a ref, not the effect's closed-over value) — so a
 * keystroke that lands mid-debounce never gets lost. See the design doc's
 * "Resolved implementation mechanics" #14.
 */
export function PortfolioPreview({ templateId, data, className }: PortfolioPreviewProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const latestDataRef = useRef(data);
	const readyRef = useRef(false);

	// Keep the ref in sync outside of render (a ref write during render is a
	// side effect) — still runs before any event/timeout could read it.
	useEffect(() => {
		latestDataRef.current = data;
	}, [data]);

	function sendData() {
		iframeRef.current?.contentWindow?.postMessage(
			{ type: "pb:data", data: latestDataRef.current },
			window.location.origin,
		);
	}

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== window.location.origin) return;
			if (event.data?.type === "pb:ready") {
				readyRef.current = true;
				sendData();
			}
		}
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);

	// A template switch reloads the iframe (new src) — stop sending until
	// the new document's own "pb:ready" arrives.
	useEffect(() => {
		readyRef.current = false;
	}, [templateId]);

	useEffect(() => {
		if (!readyRef.current) return;
		const timeout = setTimeout(sendData, 100);
		return () => clearTimeout(timeout);
		// sendData reads latestDataRef.current, not `data`, directly — the
		// effect only needs to re-run (debounced) when `data` changes.
	}, [data]);

	return (
		<iframe
			ref={iframeRef}
			src={`/preview.html?template=${encodeURIComponent(templateId)}`}
			title="Portfolio preview"
			className={cn("h-full w-full border-0 bg-white", className)}
		/>
	);
}
