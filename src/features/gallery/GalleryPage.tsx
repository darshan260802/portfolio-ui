import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useTemplates } from "./useTemplates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateThumbnail } from "@/components/ui/template-thumbnail";
import { GridCanvas } from "@/components/animated/GridCanvas";
import { SplitText } from "@/components/animated/SplitText";
import { StaggerGrid } from "@/components/animated/ScrollReveal";
import { TiltCard } from "@/components/animated/TiltCard";
import { SpotlightCard } from "@/components/animated/SpotlightCard";
import { cn } from "@/lib/utils";

function GalleryCardSkeleton() {
	return (
		<div className="animate-pulse overflow-hidden rounded-lg border border-border">
			<div className="aspect-video bg-muted" />
			<div className="space-y-3 p-6">
				<div className="h-4 w-2/3 rounded bg-muted" />
				<div className="h-3 w-full rounded bg-muted" />
				<div className="h-3 w-4/5 rounded bg-muted" />
			</div>
		</div>
	);
}

export function GalleryPage() {
	const { templates, error } = useTemplates();
	const [activeTag, setActiveTag] = useState<string | null>(null);

	const tags = useMemo(() => {
		const set = new Set<string>();
		for (const t of templates ?? []) for (const tag of t.tags) set.add(tag);
		return Array.from(set).sort();
	}, [templates]);

	const visible = useMemo(() => {
		if (!templates) return null;
		if (!activeTag) return templates;
		return templates.filter((t) => t.tags.includes(activeTag));
	}, [templates, activeTag]);

	return (
		<div>
			<div className="relative border-b border-border/70">
				<GridCanvas />
				<div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
					<span className="build-tag">Template registry · {templates ? templates.length : "…"} available</span>
					<SplitText
						as="h1"
						text="Choose a template"
						className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl"
					/>
					<p className="mt-5 max-w-xl text-lg text-muted-foreground">
						Pick a design, fill in your details, and have a hosted portfolio live in minutes.
					</p>
				</div>
			</div>

			<div className="mx-auto max-w-6xl px-6 py-16">
				{error && (
					<p className="mb-8 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Couldn't load templates: {error}
					</p>
				)}

				{tags.length > 0 && (
					<div className="mb-10 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setActiveTag(null)}
							className={cn(
								"rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
								activeTag === null
									? "border-primary bg-primary text-primary-foreground"
									: "border-border text-muted-foreground hover:text-foreground",
							)}
						>
							All
						</button>
						{tags.map((tag) => (
							<button
								key={tag}
								type="button"
								onClick={() => setActiveTag(tag === activeTag ? null : tag)}
								className={cn(
									"rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
									activeTag === tag
										? "border-primary bg-primary text-primary-foreground"
										: "border-border text-muted-foreground hover:text-foreground",
								)}
							>
								{tag}
							</button>
						))}
					</div>
				)}

				{!visible && !error && (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<GalleryCardSkeleton key={i} />
						))}
					</div>
				)}

				<StaggerGrid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{visible?.map((template) => (
						<Link key={template.id} to={`/templates/${template.id}`} className="group block">
							<TiltCard max={5}>
								<Card className="h-full overflow-hidden transition-shadow group-hover:shadow-lg">
									<SpotlightCard>
										<TemplateThumbnail
											src={template.thumbnail}
											alt={template.name}
											imageClassName="transition-transform duration-500 group-hover:scale-[1.04]"
										/>
										<CardHeader className="pt-6">
											<CardTitle>{template.name}</CardTitle>
											<CardDescription>{template.description}</CardDescription>
										</CardHeader>
										<CardContent className="flex flex-wrap gap-1.5 pt-0 pb-6">
											{template.tags.map((tag) => (
												<span
													key={tag}
													className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
												>
													{tag}
												</span>
											))}
										</CardContent>
									</SpotlightCard>
								</Card>
							</TiltCard>
						</Link>
					))}
				</StaggerGrid>

				{visible && visible.length === 0 && (
					<p className="py-16 text-center text-sm text-muted-foreground">
						No templates match "{activeTag}" — <button type="button" onClick={() => setActiveTag(null)} className="underline">clear the filter</button>.
					</p>
				)}
			</div>
		</div>
	);
}
