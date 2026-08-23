import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { emptyPortfolioData } from "@pb/templates";
import { useTemplates } from "./useTemplates";
import { PortfolioPreview } from "@/features/preview/PortfolioPreview";
import { useDraftStore } from "@/lib/draft-store";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/animated/MagneticButton";
import { ScrollReveal } from "@/components/animated/ScrollReveal";

export function TemplateDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { templates } = useTemplates();
	const template = templates?.find((t) => t.id === id);
	const { data: session } = useSession();
	const setTemplateId = useDraftStore((s) => s.setTemplateId);
	const navigate = useNavigate();

	function handleCreate() {
		if (!id) return;
		setTemplateId(id);
		navigate(session ? "/create" : "/login?next=%2Fcreate");
	}

	if (!id) return null;

	return (
		<div className="mx-auto max-w-6xl px-6 py-12">
			<Link
				to="/"
				className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				All templates
			</Link>

			<div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
				<ScrollReveal className="lg:col-span-3">
					{/* A phone/browser-style frame, evoking "this is a real, working site" rather than a flat thumbnail. */}
					<div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
						<div className="flex items-center gap-1.5 border-b border-border bg-muted px-3 py-2.5">
							<span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
							<span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
							<span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
						</div>
						<div style={{ aspectRatio: "16 / 10" }}>
							<PortfolioPreview templateId={id} data={emptyPortfolioData} />
						</div>
					</div>
				</ScrollReveal>

				<ScrollReveal delay={0.1} className="lg:col-span-2">
					<div className="lg:sticky lg:top-24">
						<span className="build-tag">Template · {id}</span>
						<h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
							{template?.name ?? "Template"}
						</h1>
						<p className="mt-4 text-muted-foreground">{template?.description}</p>
						<div className="mt-5 flex flex-wrap gap-1.5">
							{template?.tags.map((tag) => (
								<span
									key={tag}
									className="rounded-full bg-muted px-2.5 py-0.5 text-xs capitalize text-muted-foreground"
								>
									{tag}
								</span>
							))}
						</div>
						<MagneticButton className="mt-8 block w-fit">
							<Button size="lg" onClick={handleCreate}>
								Create portfolio with this template
							</Button>
						</MagneticButton>
					</div>
				</ScrollReveal>
			</div>
		</div>
	);
}
