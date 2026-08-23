import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Loader2 } from "lucide-react";
import { useTemplates } from "@/features/gallery/useTemplates";
import { useSite } from "@/features/deploy/useSite";
import { useSlugCheck } from "@/features/deploy/useSlugCheck";
import { useDeployment } from "@/features/deploy/useDeployment";
import { DeploymentTimeline } from "@/features/deploy/DeploymentTimeline";
import { api } from "@/lib/api";
import { formatApiError, slugReasonMessage } from "@/lib/api-error";
import { toast } from "@/lib/toast-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animated/ScrollReveal";
import { PORTFOLIO_DOMAIN } from "@/lib/env";
import { cn } from "@/lib/utils";

export function SettingsPage() {
	const site = useSite();
	const { templates } = useTemplates();
	const [slugInput, setSlugInput] = useState("");
	const [renaming, setRenaming] = useState(false);
	const [renameError, setRenameError] = useState<string | null>(null);
	const [renameSuccess, setRenameSuccess] = useState<string | null>(null);
	const { result: slugResult, checking } = useSlugCheck(slugInput);
	const { deployment, starting, deploy } = useDeployment();

	useEffect(() => {
		if (site) setSlugInput(site.slug);
	}, [site]);

	async function handleRename() {
		if (!site || slugInput === site.slug) return;
		setRenaming(true);
		setRenameError(null);
		setRenameSuccess(null);
		try {
			const res = await api.patch<{ slug: string; url?: string }>("/api/me/site/slug", { slug: slugInput });
			setRenameSuccess(`Renamed to ${res.slug}`);
			toast.success("Subdomain updated", `Now live at ${res.slug}`);
		} catch (err) {
			const message = formatApiError(err);
			setRenameError(message);
			toast.error("Couldn't rename subdomain", message);
		} finally {
			setRenaming(false);
		}
	}

	function handleSwitchTemplate(templateId: string) {
		if (!site) return;
		// useDeployment toasts on start/poll failure itself (see its jsdoc) —
		// callers just fire and observe `deployment.status`.
		void deploy({ slug: site.slug, templateId });
	}

	if (site === undefined) {
		return (
			<div className="flex items-center gap-2 p-16 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" /> Loading…
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
			<div>
				<span className="build-tag">Settings</span>
				<h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Manage your portfolio</h1>
			</div>

			{!site ? (
				<p className="text-sm text-muted-foreground">
					You haven't created a portfolio yet.{" "}
					<Link to="/" className="text-foreground underline">
						Browse templates
					</Link>
					.
				</p>
			) : (
				<>
					<ScrollReveal>
						<Card>
							<CardHeader>
								<CardTitle>Subdomain</CardTitle>
								<CardDescription>Changing this updates your live URL immediately.</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-3">
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="slug">Subdomain</Label>
									<div className="flex items-center gap-2">
										<Input
											id="slug"
											value={slugInput}
											onChange={(e) => setSlugInput(e.target.value)}
											aria-invalid={Boolean(slugInput !== site.slug && slugResult && !slugResult.available)}
											className="max-w-56"
										/>
										<span className="text-sm text-muted-foreground">.{PORTFOLIO_DOMAIN}</span>
									</div>
									{checking && <p className="text-xs text-muted-foreground">Checking…</p>}
									{slugInput !== site.slug && slugResult && !slugResult.available && (
										<p className="text-xs text-destructive">
											{slugReasonMessage(slugResult.reason) ?? "Not available."}
										</p>
									)}
								</div>
								<Button
									onClick={() => void handleRename()}
									disabled={renaming || slugInput === site.slug || (slugResult ? !slugResult.available : false)}
									className="w-fit"
								>
									{renaming ? "Saving…" : "Save subdomain"}
								</Button>
								{renameError && <p className="text-sm text-destructive">{renameError}</p>}
								{renameSuccess && (
									<p className="flex items-center gap-1.5 text-sm text-emerald-600">
										<Check className="h-3.5 w-3.5" /> {renameSuccess}
									</p>
								)}
							</CardContent>
						</Card>
					</ScrollReveal>

					<ScrollReveal delay={0.05}>
						<Card>
							<CardHeader>
								<CardTitle>Template</CardTitle>
								<CardDescription>Switching rebuilds and republishes your site.</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-4">
								<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
									{templates?.map((t) => (
										<button
											key={t.id}
											type="button"
											onClick={() => handleSwitchTemplate(t.id)}
											disabled={starting || t.id === site.templateId}
											className={cn(
												"overflow-hidden rounded-md border text-left text-xs transition-colors",
												t.id === site.templateId
													? "border-primary ring-1 ring-primary"
													: "border-border hover:border-foreground/30",
											)}
										>
											<img src={t.thumbnail} alt={t.name} className="aspect-video w-full object-cover" />
											<div className="p-2 font-medium">{t.name}</div>
										</button>
									))}
								</div>
								{deployment && (
									<div className="border-t border-border pt-4">
										<DeploymentTimeline status={deployment.status} />
									</div>
								)}
							</CardContent>
						</Card>
					</ScrollReveal>

					<Link to="/create" className="text-sm font-medium text-foreground underline underline-offset-4">
						Edit portfolio content
					</Link>
				</>
			)}
		</div>
	);
}
