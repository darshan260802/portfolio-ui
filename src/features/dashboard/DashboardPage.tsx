import { Link } from "react-router";
import { ArrowUpRight, Globe, Loader2 } from "lucide-react";
import { useSite } from "@/features/deploy/useSite";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animated/ScrollReveal";
import { GridCanvas } from "@/components/animated/GridCanvas";
import { cn } from "@/lib/utils";

export function DashboardPage() {
	const site = useSite();

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
							<CardDescription>Pick a template to get started — it only takes a minute.</CardDescription>
						</CardHeader>
						<CardContent>
							<Link to="/" className={cn(buttonVariants())}>
								Browse templates
							</Link>
						</CardContent>
					</Card>
				</div>
			)}

			{site && (
				<ScrollReveal>
					<Card className="overflow-hidden">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>{site.templateId}</CardTitle>
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
							<CardDescription>Template applied to your portfolio.</CardDescription>
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
							<div className="flex gap-4 border-t border-border pt-4 text-sm">
								<Link to="/create" className="font-medium text-foreground hover:underline">
									Edit content
								</Link>
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
