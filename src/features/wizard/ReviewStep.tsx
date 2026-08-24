import { useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Check, Download, Rocket, TriangleAlert } from "lucide-react";
import type { PortfolioData } from "@pb/templates";
import { apiDownload } from "@/lib/api";
import { formatApiError, slugReasonMessage } from "@/lib/api-error";
import { useSite } from "@/features/deploy/useSite";
import { useSlugCheck } from "@/features/deploy/useSlugCheck";
import { useDeployment } from "@/features/deploy/useDeployment";
import { DeploymentTimeline } from "@/features/deploy/DeploymentTimeline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
	const { site, refresh: refreshSite } = useSite();
	const [chosenSlug, setChosenSlug] = useState(() => slugify(data.profile.fullName || ""));
	const [downloading, setDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const [confirmingReplace, setConfirmingReplace] = useState(false);
	const { deployment, starting, startError, deploy } = useDeployment();

	// An account hosts one portfolio. Once it exists, POST /api/deploy
	// ignores any `slug` in the body and republishes over the existing site
	// — so the field has to show the address that will actually be
	// overwritten, not a new one the user is free to type and be quietly
	// denied. Derived rather than synced into state: the existing slug is
	// simply what this field IS once a site exists, and an effect that
	// copied it over would fight anything typed before /api/me/site landed.
	const slug = site?.slug ?? chosenSlug;
	// Nothing to check when the subdomain is already ours — and asking would
	// report our own slug as "taken".
	const { result: slugResult, checking: checkingSlug } = useSlugCheck(site ? "" : slug);

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

	function publish() {
		// Omit `slug` when a site already exists: the server would ignore it
		// anyway, and sending one implies a rename this endpoint can't do
		// (that's PATCH /api/me/site/slug, from Settings).
		void deploy(site ? { templateId } : { slug, templateId }).then(() => refreshSite());
	}

	function handleHost() {
		if (site) {
			setConfirmingReplace(true);
			return;
		}
		publish();
	}

	const slugTaken = slugResult && !slugResult.available;
	const canHost = Boolean(site) || (slug.length >= 3 && !checkingSlug && !slugTaken);
	const replacingLiveSite = site?.status === "LIVE";

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
				<p className="mb-4 mt-1.5 text-sm text-muted-foreground">
					{site
						? "Your account hosts one portfolio — publishing rebuilds and replaces it at the same address."
						: "Pick a subdomain and we'll build and host it."}
				</p>

				{site && (
					<div className="mb-4 flex gap-2.5 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
						<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
						<div className="text-accent-foreground">
							<p className="font-medium">
								{replacingLiveSite ? "You already have a live portfolio" : "You already have a portfolio"}
							</p>
							<p className="mt-0.5 opacity-90">
								{site.url ? (
									<>
										Publishing replaces what's at{" "}
										<a
											href={site.url}
											target="_blank"
											rel="noreferrer"
											className="font-medium underline underline-offset-2"
										>
											{site.url.replace(/^https?:\/\//, "")}
										</a>
										.
									</>
								) : (
									<>Publishing replaces the draft saved under {site.slug}.</>
								)}{" "}
								An account can't host more than one.
							</p>
						</div>
					</div>
				)}

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="slug">Subdomain</Label>
					<div className="flex flex-wrap items-center gap-2">
						<Input
							id="slug"
							value={slug}
							onChange={(e) => setChosenSlug(slugify(e.target.value))}
							disabled={Boolean(site)}
							aria-invalid={Boolean(!site && slugTaken)}
							className="max-w-56"
						/>
						<span className="text-sm text-muted-foreground">.{PORTFOLIO_DOMAIN}</span>
					</div>
					{site ? (
						<p className="text-xs text-muted-foreground">
							This is your portfolio's address.{" "}
							<Link to="/settings" className="underline underline-offset-2">
								Rename it in Settings
							</Link>
							.
						</p>
					) : (
						<>
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
						</>
					)}
				</div>

				<MagneticButton className="mt-4 block w-fit">
					<Button type="button" onClick={handleHost} disabled={!canHost || starting}>
						{starting ? "Starting…" : site ? "Replace my portfolio" : "Host my portfolio"}
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

			<ConfirmDialog
				open={confirmingReplace}
				title={replacingLiveSite ? "Replace your live portfolio?" : "Replace your saved portfolio?"}
				description={
					<p>
						{site?.url ? (
							<>
								This rebuilds{" "}
								<span className="font-medium text-foreground">{site.url.replace(/^https?:\/\//, "")}</span> from
								what you've entered here and publishes it over the current site. Visitors see the new version as
								soon as the build finishes.
							</>
						) : (
							<>
								This builds and publishes{" "}
								<span className="font-medium text-foreground">
									{site?.slug}.{PORTFOLIO_DOMAIN}
								</span>{" "}
								from what you've entered here, replacing the portfolio saved on your account.
							</>
						)}
					</p>
				}
				confirmLabel="Publish and replace"
				onConfirm={() => {
					setConfirmingReplace(false);
					publish();
				}}
				onCancel={() => setConfirmingReplace(false)}
			/>
		</div>
	);
}
