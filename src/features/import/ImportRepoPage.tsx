import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Check, GitBranch, Loader2, Rocket, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import { apiErrorFields, formatApiError, slugReasonMessage } from "@/lib/api-error";
import { toast } from "@/lib/toast-store";
import { useSite } from "@/features/deploy/useSite";
import { useSlugCheck } from "@/features/deploy/useSlugCheck";
import { useDeployment, type GitSourceInput } from "@/features/deploy/useDeployment";
import { DeploymentTimeline } from "@/features/deploy/DeploymentTimeline";
import { EnvVarsEditor, envRowsFromKeys, envRowsToPayload, type EnvRow } from "./EnvVarsEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MagneticButton } from "@/components/animated/MagneticButton";
import { ScrollReveal } from "@/components/animated/ScrollReveal";
import { GridCanvas } from "@/components/animated/GridCanvas";
import { PORTFOLIO_DOMAIN } from "@/lib/env";

/**
 * "I already have a portfolio project" — the alternative to picking one of
 * our templates. The user gives us a public repo, the commands to build it
 * and the folder the build writes into; the API clones it, runs those
 * commands, publishes the output at their subdomain and deletes the
 * checkout.
 *
 * The defaults matter more than the fields: `bun install`, `bun run build`
 * and `dist` are what the overwhelming majority of Vite/Bun projects need,
 * so the honest minimum here is one URL and a subdomain. Everything else is
 * pre-filled and only touched by people who know they need to.
 */

const DEFAULTS = {
	installCommand: "bun install",
	buildCommand: "bun run build",
	buildDir: "dist",
};

function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/** "https://github.com/me/site" → "me-site", a sensible first subdomain guess. */
function slugFromRepoUrl(repoUrl: string): string {
	const path = repoUrl.replace(/^https?:\/\//, "").replace(/\.git$/, "");
	const segments = path.split("/").filter(Boolean).slice(1);
	return slugify(segments.slice(-2).join("-"));
}

export function ImportRepoPage() {
	const { site, refresh: refreshSite } = useSite();
	const { deployment, starting, deploy } = useDeployment();

	const [repoUrl, setRepoUrl] = useState("");
	const [branch, setBranch] = useState("");
	const [installCommand, setInstallCommand] = useState(DEFAULTS.installCommand);
	const [buildCommand, setBuildCommand] = useState(DEFAULTS.buildCommand);
	const [buildDir, setBuildDir] = useState(DEFAULTS.buildDir);
	const [envRows, setEnvRows] = useState<EnvRow[]>([]);
	const [slugInput, setSlugInput] = useState("");
	const [slugEdited, setSlugEdited] = useState(false);

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [savedNotice, setSavedNotice] = useState<string | null>(null);
	const [confirmingReplace, setConfirmingReplace] = useState(false);

	// Seed the form from whatever config is already on file. Keyed on
	// `site.git` rather than run once on mount: /api/me/site lands after the
	// first render, and a form that ignored it would silently offer to
	// overwrite a saved config with blank defaults.
	const savedGit = site?.git ?? null;
	useEffect(() => {
		if (!savedGit) return;
		setRepoUrl(savedGit.repoUrl);
		setBranch(savedGit.branch ?? "");
		setInstallCommand(savedGit.installCommand);
		setBuildCommand(savedGit.buildCommand);
		setBuildDir(savedGit.buildDir);
		setEnvRows(envRowsFromKeys(savedGit.envKeys));
	}, [savedGit]);

	// The subdomain is only choosable before a site exists (an account hosts
	// one portfolio; renaming is Settings' job), so once it does, the field
	// shows the address that will actually be published over.
	const slug = site ? site.slug : slugEdited || slugInput ? slugInput : slugFromRepoUrl(repoUrl);
	const { result: slugResult, checking: checkingSlug } = useSlugCheck(site ? "" : slug);
	const slugTaken = Boolean(slugResult && !slugResult.available);

	function buildPayload(): GitSourceInput {
		return {
			repoUrl: repoUrl.trim(),
			branch: branch.trim() || null,
			installCommand: installCommand.trim() || DEFAULTS.installCommand,
			buildCommand: buildCommand.trim() || DEFAULTS.buildCommand,
			buildDir: buildDir.trim() || DEFAULTS.buildDir,
			env: envRowsToPayload(envRows),
		};
	}

	function beginRequest() {
		setError(null);
		setFieldErrors({});
		setSavedNotice(null);
	}

	function reportFailure(err: unknown, title: string) {
		const message = formatApiError(err);
		setError(message);
		setFieldErrors(apiErrorFields(err) ?? {});
		toast.error(title, message);
	}

	/** Save the config without building — for rotating a key or fixing a command. */
	async function handleSave() {
		beginRequest();
		setSaving(true);
		try {
			await api.put("/api/me/site/git", { ...buildPayload(), ...(site ? {} : { slug }) });
			setSavedNotice("Repository settings saved.");
			toast.success("Repository settings saved", "Publish when you're ready to build them.");
			await refreshSite();
		} catch (err) {
			reportFailure(err, "Couldn't save your repository settings");
		} finally {
			setSaving(false);
		}
	}

	function publish() {
		beginRequest();
		// One request: the API saves the config and queues the build from it,
		// so there's no window where a half-saved config gets published.
		void deploy({
			...(site ? {} : { slug }),
			source: "GIT",
			git: buildPayload(),
		}).then(() => refreshSite());
	}

	function handlePublish() {
		if (site) {
			setConfirmingReplace(true);
			return;
		}
		publish();
	}

	const busy = saving || starting;
	const canSubmit = repoUrl.trim().length > 0 && (Boolean(site) || (slug.length >= 3 && !checkingSlug && !slugTaken));
	const replacingTemplate = site?.source === "TEMPLATE";

	if (site === undefined) {
		return (
			<div className="flex items-center gap-2 p-16 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" /> Loading…
			</div>
		);
	}

	return (
		<div>
			<div className="relative border-b border-border/70">
				<GridCanvas />
				<div className="relative mx-auto max-w-3xl px-6 py-16">
					<span className="build-tag">Source · Your repository</span>
					<h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
						Host your own project
					</h1>
					<p className="mt-4 max-w-xl text-muted-foreground">
						Already built your portfolio? Point us at the public repo. We clone it, run your build with Bun,
						and serve the output at your subdomain — no template, your code.
					</p>
				</div>
			</div>

			<div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
				{replacingTemplate && (
					<div className="flex gap-2.5 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
						<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
						<div className="min-w-0 text-foreground">
							<p className="font-medium">Your portfolio currently uses a template</p>
							<p className="mt-0.5 text-muted-foreground">
								Publishing from a repository replaces what's at{" "}
								<span className="font-medium text-foreground">
									{site.slug}.{PORTFOLIO_DOMAIN}
								</span>
								. Your template pick and portfolio content are kept — you can switch back from Settings.
							</p>
						</div>
					</div>
				)}

				<ScrollReveal>
					<Card>
						<CardHeader>
							<CardTitle>Repository</CardTitle>
							<CardDescription>A public repository on GitHub, GitLab, Bitbucket or Codeberg.</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-5">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="repo-url">Repository URL</Label>
								<Input
									id="repo-url"
									value={repoUrl}
									onChange={(e) => setRepoUrl(e.target.value)}
									placeholder="https://github.com/you/portfolio"
									spellCheck={false}
									autoCapitalize="off"
									autoCorrect="off"
									aria-invalid={Boolean(fieldErrors.repoUrl)}
									disabled={busy}
								/>
								<FieldError message={fieldErrors.repoUrl} />
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="repo-branch">Branch</Label>
								<div className="flex items-center gap-2">
									<GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
									<Input
										id="repo-branch"
										value={branch}
										onChange={(e) => setBranch(e.target.value)}
										placeholder="default branch"
										spellCheck={false}
										aria-invalid={Boolean(fieldErrors.branch)}
										disabled={busy}
										className="max-w-64"
									/>
								</div>
								<FieldError message={fieldErrors.branch} />
								<p className="text-xs text-muted-foreground">
									Leave blank to build whatever the repository's default branch points at.
								</p>
							</div>
						</CardContent>
					</Card>
				</ScrollReveal>

				<ScrollReveal delay={0.05}>
					<Card>
						<CardHeader>
							<CardTitle>Build</CardTitle>
							<CardDescription>
								We run these with Bun, inside your repository. Both have to start with{" "}
								<code className="font-mono text-xs">bun</code> or{" "}
								<code className="font-mono text-xs">bunx</code>.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-5">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="install-command">Install command</Label>
								<Input
									id="install-command"
									value={installCommand}
									onChange={(e) => setInstallCommand(e.target.value)}
									placeholder={DEFAULTS.installCommand}
									spellCheck={false}
									autoCapitalize="off"
									autoCorrect="off"
									aria-invalid={Boolean(fieldErrors.installCommand)}
									disabled={busy}
									className="font-mono text-xs"
								/>
								<FieldError message={fieldErrors.installCommand} />
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="build-command">Build command</Label>
								<Input
									id="build-command"
									value={buildCommand}
									onChange={(e) => setBuildCommand(e.target.value)}
									placeholder={DEFAULTS.buildCommand}
									spellCheck={false}
									autoCapitalize="off"
									autoCorrect="off"
									aria-invalid={Boolean(fieldErrors.buildCommand)}
									disabled={busy}
									className="font-mono text-xs"
								/>
								<FieldError message={fieldErrors.buildCommand} />
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="build-dir">Build folder</Label>
								<Input
									id="build-dir"
									value={buildDir}
									onChange={(e) => setBuildDir(e.target.value)}
									placeholder={DEFAULTS.buildDir}
									spellCheck={false}
									autoCapitalize="off"
									autoCorrect="off"
									aria-invalid={Boolean(fieldErrors.buildDir)}
									disabled={busy}
									className="max-w-64 font-mono text-xs"
								/>
								<FieldError message={fieldErrors.buildDir} />
								<p className="text-xs text-muted-foreground">
									The folder your build writes into. It has to contain an{" "}
									<code className="font-mono">index.html</code> — that's what visitors get.
								</p>
							</div>
						</CardContent>
					</Card>
				</ScrollReveal>

				<ScrollReveal delay={0.1}>
					<Card>
						<CardHeader>
							<CardTitle>Environment variables</CardTitle>
							<CardDescription>
								Available to your install and build commands. Stored encrypted, and never shown again after
								you save — you can replace a value, not read it back.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<EnvVarsEditor
								rows={envRows}
								onChange={setEnvRows}
								disabled={busy}
								fieldErrors={fieldErrors}
							/>
							<p className="mt-4 text-xs text-muted-foreground">
								Anything a bundler inlines (a <code className="font-mono">VITE_</code> variable, say) ends up
								readable in your published JavaScript. That's your build's behaviour, not ours — keep real secrets
								out of the client bundle.
							</p>
						</CardContent>
					</Card>
				</ScrollReveal>

				<ScrollReveal delay={0.15}>
					<div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-6">
						<div className="flex items-center gap-2">
							<Rocket className="h-4 w-4 text-primary" />
							<h2 className="font-display text-lg font-semibold">Publish</h2>
						</div>

						<div className="mt-4 flex flex-col gap-1.5">
							<Label htmlFor="import-slug">Subdomain</Label>
							<div className="flex flex-wrap items-center gap-2">
								<Input
									id="import-slug"
									value={slug}
									onChange={(e) => {
										setSlugEdited(true);
										setSlugInput(slugify(e.target.value));
									}}
									disabled={Boolean(site) || busy}
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

						<div className="mt-5 flex flex-wrap items-center gap-3">
							<MagneticButton className="block w-fit">
								<Button type="button" onClick={handlePublish} disabled={!canSubmit || busy}>
									{starting ? "Starting…" : site ? "Save and republish" : "Build and host it"}
								</Button>
							</MagneticButton>
							<Button
								type="button"
								variant="outline"
								onClick={() => void handleSave()}
								disabled={!canSubmit || busy}
							>
								{saving ? "Saving…" : "Save without publishing"}
							</Button>
						</div>

						{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
						{savedNotice && (
							<p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600">
								<Check className="h-3.5 w-3.5" /> {savedNotice}
							</p>
						)}

						{deployment && (
							<div className="mt-5 rounded-lg border border-border bg-card p-4">
								<DeploymentTimeline status={deployment.status} />
								{deployment.status === "LIVE" && deployment.url && (
									<a
										href={deployment.url}
										target="_blank"
										rel="noreferrer"
										className="mt-3 flex items-start gap-1.5 text-sm font-medium text-primary hover:underline"
									>
										<span className="min-w-0 [overflow-wrap:anywhere]">{deployment.url}</span>
										<ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
									</a>
								)}
								{deployment.status === "FAILED" && deployment.log && (
									<pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 font-mono text-xs">
										{deployment.log}
									</pre>
								)}
							</div>
						)}
					</div>
				</ScrollReveal>

				<p className="text-sm text-muted-foreground">
					Prefer not to bring your own?{" "}
					<Link to="/" className="text-foreground underline underline-offset-4">
						Browse our templates
					</Link>
					.
				</p>
			</div>

			<ConfirmDialog
				open={confirmingReplace}
				title={site?.status === "LIVE" ? "Replace your live portfolio?" : "Replace your saved portfolio?"}
				description={
					<p>
						This builds{" "}
						<span className="font-medium text-foreground">{repoUrl.trim() || "your repository"}</span> and
						publishes it over{" "}
						<span className="font-medium text-foreground">
							{site?.slug}.{PORTFOLIO_DOMAIN}
						</span>
						. Visitors see the new version as soon as the build finishes.
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
