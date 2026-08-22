import { Link } from "react-router";
import { useTemplates } from "./useTemplates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function GalleryPage() {
	const { templates, error } = useTemplates();

	return (
		<div className="mx-auto max-w-5xl px-6 py-16">
			<div className="mb-10 flex flex-col gap-2">
				<h1 className="font-display text-3xl font-semibold">Choose a template</h1>
				<p className="text-muted-foreground">
					Pick a design, fill in your details, and have a hosted portfolio in minutes.
				</p>
			</div>

			{error && <p className="text-sm text-destructive">Couldn't load templates: {error}</p>}

			{!templates && !error && <p className="text-sm text-muted-foreground">Loading templates…</p>}

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{templates?.map((template) => (
					<Link key={template.id} to={`/templates/${template.id}`} className="group">
						<Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
							<div className="aspect-video bg-muted">
								<img
									src={template.thumbnail}
									alt={template.name}
									className="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
							<CardHeader>
								<CardTitle>{template.name}</CardTitle>
								<CardDescription>{template.description}</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-1.5 pt-0">
								{template.tags.map((tag) => (
									<span
										key={tag}
										className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
									>
										{tag}
									</span>
								))}
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
