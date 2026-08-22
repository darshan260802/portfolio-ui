import { useNavigate, useParams } from "react-router";
import { emptyPortfolioData } from "@pb/templates";
import { useTemplates } from "./useTemplates";
import { PortfolioPreview } from "@/features/preview/PortfolioPreview";
import { useDraftStore } from "@/lib/draft-store";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

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
		<div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-16 lg:grid-cols-2">
			<div className="overflow-hidden rounded-lg border border-border" style={{ aspectRatio: "16 / 10" }}>
				<PortfolioPreview templateId={id} data={emptyPortfolioData} />
			</div>
			<div className="flex flex-col gap-4">
				<h1 className="font-display text-3xl font-semibold">{template?.name ?? "Template"}</h1>
				<p className="text-muted-foreground">{template?.description}</p>
				<div className="flex flex-wrap gap-1.5">
					{template?.tags.map((tag) => (
						<span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
							{tag}
						</span>
					))}
				</div>
				<Button size="lg" className="w-fit" onClick={handleCreate}>
					Create portfolio with this template
				</Button>
			</div>
		</div>
	);
}
