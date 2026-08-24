import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Loader2, Moon, Sun } from "lucide-react";
import { useTemplates } from "@/features/gallery/useTemplates";
import { useSite } from "@/features/deploy/useSite";
import { useSlugCheck } from "@/features/deploy/useSlugCheck";
import { useDeployment } from "@/features/deploy/useDeployment";
import { DeploymentTimeline } from "@/features/deploy/DeploymentTimeline";
import { useAppearance, type ThemeMode } from "./useAppearance";
import { api } from "@/lib/api";
import { formatApiError, slugReasonMessage } from "@/lib/api-error";
import { toast } from "@/lib/toast-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateThumbnail } from "@/components/ui/template-thumbnail";
import { ScrollReveal } from "@/components/animated/ScrollReveal";
import { PORTFOLIO_DOMAIN } from "@/lib/env";
import { cn } from "@/lib/utils";

const THEME_MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
];

export function SettingsPage() {
	const { site, refresh: refreshSite } = useSite();
	const { templates } = useTemplates();
	const { mode, saving: savingMode, save: saveMode } = useAppearance();
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
			void refreshSite();
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
		// callers just fire and observe `deployment.status`. The server
		// updates Site.templateId synchronously on accepting the request
		// (before the build even starts), so refreshing right after also
		// picks up a failed attempt correctly (no-op — templateId won't have
		// moved server-side).
		void deploy({ slug: site.slug, templateId }).then(() => refreshSite());
	}

	function handleSwitchMode(next: ThemeMode) {
		if (!site || next === mode) return;
		// Save first, redeploy only if the save landed: the build reads
		// theme.mode straight out of the stored profile, so republishing
		// against an unsaved change would just rebuild the old appearance
		// and look like the toggle silently did nothing.
		void saveMode(next).then((ok) => {
			if (ok) void deploy({ slug: site.slug });
		});
	}

	const busy = starting || savingMode;

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
									<div className="flex flex-wrap items-center gap-2">
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
								<CardTitle>Appearance</CardTitle>
								<CardDescription>
									Publish your portfolio in light or dark. Switching rebuilds and republishes it, same as
									changing the template.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div
									role="group"
									aria-label="Published appearance"
									className="flex w-full gap-1 rounded-md border border-border bg-card p-1 sm:w-fit"
								>
									{THEME_MODES.map(({ value, label, icon: Icon }) => {
										const active = mode === value;
										return (
											<button
												key={value}
												type="button"
												onClick={() => handleSwitchMode(value)}
												disabled={busy || mode === undefined}
												aria-pressed={active}
												className={cn(
													"flex flex-1 items-center justify-center gap-2 rounded px-4 py-2 text-sm transition-colors disabled:opacity-60 sm:flex-none",
													active
														? "bg-primary text-primary-foreground"
														: "text-muted-foreground hover:text-foreground",
												)}
											>
												<Icon className="h-4 w-4" />
												{label}
											</button>
										);
									})}
								</div>
								{mode === undefined && (
									<p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
										<Loader2 className="h-3 w-3 animate-spin" /> Loading current appearance…
									</p>
								)}
								<p className="mt-3 text-xs text-muted-foreground">
									Some templates are designed light-first and others dark-first, so the same choice looks
									different across templates.
								</p>
							</CardContent>
						</Card>
					</ScrollReveal>

					<ScrollReveal delay={0.1}>
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
											disabled={busy || t.id === site.templateId}
											className={cn(
												"overflow-hidden rounded-md border text-left text-xs transition-colors",
												t.id === site.templateId
													? "border-primary ring-1 ring-primary"
													: "border-border hover:border-foreground/30",
											)}
										>
											<TemplateThumbnail src={t.thumbnail} alt={t.name} />
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
