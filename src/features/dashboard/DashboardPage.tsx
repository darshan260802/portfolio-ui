import { Link } from "react-router";
import { useSite } from "@/features/deploy/useSite";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardPage() {
	const site = useSite();

	return (
		<div className="mx-auto max-w-2xl px-6 py-16">
			<h1 className="mb-8 font-display text-3xl font-semibold">Dashboard</h1>

			{site === undefined && <p className="text-sm text-muted-foreground">Loading…</p>}

			{site === null && (
				<Card>
					<CardHeader>
						<CardTitle>No portfolio yet</CardTitle>
						<CardDescription>Pick a template to get started.</CardDescription>
					</CardHeader>
					<CardContent>
						<Link to="/" className={cn(buttonVariants())}>
							Browse templates
						</Link>
					</CardContent>
				</Card>
			)}

			{site && (
				<Card>
					<CardHeader>
						<CardTitle>Your portfolio</CardTitle>
						<CardDescription>
							Template: {site.templateId} · Status: {site.status}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						{site.url ? (
							<a href={site.url} target="_blank" rel="noreferrer" className="text-primary underline">
								{site.url}
							</a>
						) : (
							<p className="text-sm text-muted-foreground">Not hosted yet — finish and publish it.</p>
						)}
						<div className="flex gap-3">
							<Link to="/create" className="text-sm underline">
								Edit content
							</Link>
							<Link to="/settings" className="text-sm underline">
								Settings
							</Link>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
