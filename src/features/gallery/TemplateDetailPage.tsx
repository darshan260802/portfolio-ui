import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { emptyPortfolioData } from "@pb/templates";
import { useTemplates } from "./useTemplates";
import { promotionOf } from "./promotions";
import { PromotionBadge } from "./PromotionBadge";
import { PortfolioPreview } from "@/features/preview/PortfolioPreview";
import { useSite } from "@/features/deploy/useSite";
import { useDraftStore } from "@/lib/draft-store";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MagneticButton } from "@/components/animated/MagneticButton";
import { ScrollReveal } from "@/components/animated/ScrollReveal";

export function TemplateDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { templates } = useTemplates();
	const template = templates?.find((t) => t.id === id);
	const { data: session } = useSession();
	const { site } = useSite({ enabled: Boolean(session) });
	const setTemplateId = useDraftStore((s) => s.setTemplateId);
	const navigate = useNavigate();
	const [confirmingOverwrite, setConfirmingOverwrite] = useState(false);

	function startCreate() {
		if (!id) return;
		setTemplateId(id);
		navigate(session ? "/create" : "/login?next=%2Fcreate");
	}

	function handleCreate() {
		if (!id) return;
		// An account hosts exactly one portfolio, so "create a new one" is
		// really "replace the one you already have". Silently walking into
		// the wizard hid that: the only signal was the live site changing
		// under the user after they published. Ask first.
		if (site) {
			setConfirmingOverwrite(true);
			return;
		}
		startCreate();
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
						<div className="flex flex-wrap items-center gap-3">
							<span className="build-tag">Template · {id}</span>
							{promotionOf(id) && <PromotionBadge promotion={promotionOf(id)!} />}
						</div>
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
						{/* This label is long enough to exceed a phone's content width on
						    its own, and buttons are whitespace-nowrap by default — let it
						    wrap (and grow taller) rather than push the page sideways. */}
						<MagneticButton className="mt-8 block w-fit max-w-full">
							<Button
								size="lg"
								onClick={handleCreate}
								className="h-auto max-w-full whitespace-normal px-5 py-3 text-center sm:px-8"
							>
								{site ? "Use this template instead" : "Create portfolio with this template"}
							</Button>
						</MagneticButton>
						{site && (
							<p className="mt-3 text-xs text-muted-foreground">
								You already have a portfolio
								{site.url ? ` at ${site.url.replace(/^https?:\/\//, "")}` : ""} — an account can host one at a
								time.
							</p>
						)}
					</div>
				</ScrollReveal>
			</div>

			<ConfirmDialog
				open={confirmingOverwrite}
				title="This will replace your existing portfolio"
				description={
					<>
						<p>
							Your account already has a portfolio
							{site?.url ? (
								<>
									{" "}
									published at{" "}
									<a
										href={site.url}
										target="_blank"
										rel="noreferrer"
										className="font-medium text-foreground underline underline-offset-2"
									>
										{site.url.replace(/^https?:\/\//, "")}
									</a>
								</>
							) : (
								<> using the {site?.templateId} template</>
							)}
							. Portfolio Builder hosts one portfolio per account, so publishing with{" "}
							<span className="font-medium text-foreground">{template?.name ?? id}</span> replaces it at the same
							address.
						</p>
						<p className="mt-2">
							Your saved content carries over and the current site stays live until you publish again — but the
							old design won't come back on its own.
						</p>
					</>
				}
				confirmLabel="Replace it"
				secondary={{ label: "Edit the existing one", onSelect: () => navigate("/create") }}
				onConfirm={() => {
					setConfirmingOverwrite(false);
					startCreate();
				}}
				onCancel={() => setConfirmingOverwrite(false)}
			/>
		</div>
	);
}
