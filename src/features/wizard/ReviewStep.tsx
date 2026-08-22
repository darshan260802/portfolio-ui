import { useState } from "react";
import type { PortfolioData } from "@pb/templates";
import { apiDownload } from "@/lib/api";
import { useSlugCheck } from "@/features/deploy/useSlugCheck";
import { useDeployment } from "@/features/deploy/useDeployment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PORTFOLIO_DOMAIN } from "@/lib/env";

interface ReviewStepProps {
	templateId: string;
	data: PortfolioData;
}

function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function ReviewStep({ templateId, data }: ReviewStepProps) {
	const [slug, setSlug] = useState(() => slugify(data.profile.fullName || ""));
	const [downloading, setDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const { result: slugResult, checking: checkingSlug } = useSlugCheck(slug);
	const { deployment, starting, startError, deploy } = useDeployment();

	async function handleDownload() {
		setDownloading(true);
		setDownloadError(null);
		try {
			const res = await apiDownload("/api/export/zip", { templateId });
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${slug || "portfolio"}.zip`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			setDownloadError((err as Error).message);
		} finally {
			setDownloading(false);
		}
	}

	function handleHost() {
		void deploy({ slug, templateId });
	}

	const slugTaken = slugResult && !slugResult.available;
	const canHost = slug.length >= 3 && !checkingSlug && !slugTaken;

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h2 className="font-display text-lg font-semibold">Download</h2>
				<p className="mb-3 text-sm text-muted-foreground">
					Get a real Vite + React project with your data baked in — run it, edit it, deploy it anywhere.
				</p>
				<Button type="button" variant="outline" onClick={handleDownload} disabled={downloading}>
					{downloading ? "Preparing…" : "Download project (.zip)"}
				</Button>
				{downloadError && <p className="mt-2 text-sm text-destructive">{downloadError}</p>}
			</div>

			<div>
				<h2 className="font-display text-lg font-semibold">Host it on Portfolio Builder</h2>
				<p className="mb-3 text-sm text-muted-foreground">Pick a subdomain and we'll build and host it.</p>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="slug">Subdomain</Label>
					<div className="flex items-center gap-2">
						<Input
							id="slug"
							value={slug}
							onChange={(e) => setSlug(slugify(e.target.value))}
							className="max-w-56"
						/>
						<span className="text-sm text-muted-foreground">.{PORTFOLIO_DOMAIN}</span>
					</div>
					{checkingSlug && <p className="text-xs text-muted-foreground">Checking availability…</p>}
					{slugResult && !slugResult.available && (
						<p className="text-xs text-destructive">
							{slugResult.reason === "taken" ? "That subdomain is taken." : "Not a valid subdomain."}
						</p>
					)}
					{slugResult?.available && <p className="text-xs text-green-600">Available!</p>}
				</div>

				<Button type="button" className="mt-3" onClick={handleHost} disabled={!canHost || starting}>
					{starting ? "Starting…" : "Host my portfolio"}
				</Button>
				{startError && <p className="mt-2 text-sm text-destructive">{startError}</p>}

				{deployment && (
					<div className="mt-4 rounded-md border border-border p-4 text-sm">
						<p>
							Status: <span className="font-medium">{deployment.status}</span>
						</p>
						{deployment.status === "LIVE" && deployment.url && (
							<p className="mt-1">
								Live at{" "}
								<a href={deployment.url} target="_blank" rel="noreferrer" className="text-primary underline">
									{deployment.url}
								</a>
							</p>
						)}
						{deployment.status === "FAILED" && deployment.log && (
							<pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">
								{deployment.log}
							</pre>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
