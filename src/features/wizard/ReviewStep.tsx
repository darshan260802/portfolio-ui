import { useState } from "react";
import { ArrowUpRight, Check, Download, Rocket } from "lucide-react";
import type { PortfolioData } from "@pb/templates";
import { apiDownload } from "@/lib/api";
import { formatApiError, slugReasonMessage } from "@/lib/api-error";
import { useSlugCheck } from "@/features/deploy/useSlugCheck";
import { useDeployment } from "@/features/deploy/useDeployment";
import { DeploymentTimeline } from "@/features/deploy/DeploymentTimeline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/animated/MagneticButton";
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
			setDownloadError(formatApiError(err));
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
		<div className="flex flex-col gap-6">
			<div className="rounded-xl border border-border p-6">
				<div className="flex items-center gap-2">
					<Download className="h-4 w-4 text-muted-foreground" />
					<h2 className="font-display text-lg font-semibold">Download the project</h2>
				</div>
				<p className="mb-4 mt-1.5 text-sm text-muted-foreground">
					A real Vite + React project with your data baked in — run it, edit it, deploy it anywhere.
				</p>
				<Button type="button" variant="outline" onClick={handleDownload} disabled={downloading}>
					{downloading ? "Preparing…" : "Download project (.zip)"}
				</Button>
				{downloadError && <p className="mt-2 text-sm text-destructive">{downloadError}</p>}
			</div>

			<div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-6">
				<div className="flex items-center gap-2">
					<Rocket className="h-4 w-4 text-primary" />
					<h2 className="font-display text-lg font-semibold">Host it on Portfolio Builder</h2>
				</div>
				<p className="mb-4 mt-1.5 text-sm text-muted-foreground">Pick a subdomain and we'll build and host it.</p>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="slug">Subdomain</Label>
					<div className="flex items-center gap-2">
						<Input
							id="slug"
							value={slug}
							onChange={(e) => setSlug(slugify(e.target.value))}
							aria-invalid={Boolean(slugTaken)}
							className="max-w-56"
						/>
						<span className="text-sm text-muted-foreground">.{PORTFOLIO_DOMAIN}</span>
					</div>
					{checkingSlug && <p className="text-xs text-muted-foreground">Checking availability…</p>}
					{slugResult && !slugResult.available && (
						<p className="text-xs text-destructive">
							{slugReasonMessage(slugResult.reason) ?? "Not a valid subdomain."}
						</p>
					)}
					{slugResult?.available && (
						<p className="flex items-center gap-1 text-xs text-emerald-600">
							<Check className="h-3 w-3" /> Available
						</p>
					)}
				</div>

				<MagneticButton className="mt-4 block w-fit">
					<Button type="button" onClick={handleHost} disabled={!canHost || starting}>
						{starting ? "Starting…" : "Host my portfolio"}
					</Button>
				</MagneticButton>
				{startError && <p className="mt-2 text-sm text-destructive">{startError}</p>}

				{deployment && (
					<div className="mt-5 rounded-lg border border-border bg-card p-4">
						<DeploymentTimeline status={deployment.status} />
						{deployment.status === "LIVE" && deployment.url && (
							<a
								href={deployment.url}
								target="_blank"
								rel="noreferrer"
								className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
							>
								{deployment.url}
								<ArrowUpRight className="h-3.5 w-3.5" />
							</a>
						)}
						{deployment.status === "FAILED" && deployment.log && (
							<pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 font-mono text-xs">
								{deployment.log}
							</pre>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
