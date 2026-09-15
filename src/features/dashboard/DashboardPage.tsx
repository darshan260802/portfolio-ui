import { Link } from "react-router";
import { ArrowUpRight, GitBranch, Globe, LayoutTemplate, Loader2 } from "lucide-react";
import { useSite } from "@/features/deploy/useSite";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animated/ScrollReveal";
import { GridCanvas } from "@/components/animated/GridCanvas";
import { cn } from "@/lib/utils";

/** "https://github.com/me/site.git" → "me/site" — the part anyone recognises. */
function repoLabel(repoUrl: string | undefined): string {
	if (!repoUrl) return "Your repository";
	return repoUrl.replace(/^https?:\/\//, "").replace(/\.git$/, "").split("/").slice(1).join("/") || repoUrl;
}

export function DashboardPage() {
	const { site } = useSite();

	return (
		<div className="mx-auto max-w-2xl px-6 py-16">
			<span className="build-tag">Dashboard</span>
			<h1 className="mb-10 mt-2 font-display text-3xl font-semibold tracking-tight">Your portfolio</h1>

			{site === undefined && (
				<div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
					<Loader2 className="h-4 w-4 animate-spin" />
					Loading…
				</div>
			)}

			{site === null && (
				<div className="relative overflow-hidden rounded-xl border border-border">
					<GridCanvas />
					<Card className="relative border-none bg-transparent shadow-none">
						<CardHeader>
							<CardTitle>No portfolio yet</CardTitle>
							<CardDescription>
								Start from one of our templates, or bring a project you've already built.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-3">
							<Link to="/" className={cn(buttonVariants())}>
								Browse templates
							</Link>
							<Link to="/import" className={cn(buttonVariants({ variant: "outline" }))}>
								<GitBranch className="h-4 w-4" />
								Host your own repo
							</Link>
						</CardContent>
					</Card>
				</div>
			)}

			{site && (
				<ScrollReveal>
					<Card className="overflow-hidden">
						<CardHeader>
							<div className="flex items-center justify-between gap-3">
								{/* A repo-backed site has no template to name, so the
								    repository is the identity here — "aurora" would be
								    actively wrong, and the repo is what a user checks
								    when they're wondering what's actually published. */}
								<CardTitle className="min-w-0 [overflow-wrap:anywhere]">
									{site.source === "GIT" ? repoLabel(site.git?.repoUrl) : site.templateId}
								</CardTitle>
								<span
									className={cn(
										"build-tag rounded-full border px-2.5 py-1",
										site.status === "LIVE" ? "border-emerald-500/30 text-emerald-600" : "border-border",
									)}
								>
									<span
										className={cn(
											"h-1.5 w-1.5 rounded-full",
											site.status === "LIVE" ? "bg-emerald-500" : "bg-muted-foreground",
										)}
									/>
									{site.status}
								</span>
							</div>
							<CardDescription className="flex items-center gap-1.5">
								{site.source === "GIT" ? (
									<>
										<GitBranch className="h-3.5 w-3.5 shrink-0" />
										Built from your repository{site.git?.branch ? ` (${site.git.branch})` : ""}.
									</>
								) : (
									<>
										<LayoutTemplate className="h-3.5 w-3.5 shrink-0" />
										Template applied to your portfolio.
									</>
								)}
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-5">
							{site.url ? (
								<a
									href={site.url}
									target="_blank"
									rel="noreferrer"
									className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
								>
									<Globe className="h-4 w-4" />
									{site.url.replace(/^https?:\/\//, "")}
									<ArrowUpRight className="h-3.5 w-3.5" />
								</a>
							) : (
								<p className="text-sm text-muted-foreground">Not hosted yet — finish and publish it.</p>
							)}
							<div className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
								{site.source === "GIT" ? (
									<Link to="/import" className="font-medium text-foreground hover:underline">
										Edit repo settings
									</Link>
								) : (
									<Link to="/create" className="font-medium text-foreground hover:underline">
										Edit content
									</Link>
								)}
								<Link to="/settings" className="font-medium text-foreground hover:underline">
									Settings
								</Link>
							</div>
						</CardContent>
					</Card>
				</ScrollReveal>
			)}
		</div>
	);
}
