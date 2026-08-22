import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { PortfolioData } from "@pb/templates";
import { api } from "@/lib/api";
import { useDraftStore } from "@/lib/draft-store";
import { PortfolioPreview } from "@/features/preview/PortfolioPreview";
import { WIZARD_STEPS } from "./steps";
import { BasicsStep } from "./BasicsStep";
import { ExperienceStep } from "./ExperienceStep";
import { ProjectsStep } from "./ProjectsStep";
import { SkillsStep } from "./SkillsStep";
import { ReviewStep } from "./ReviewStep";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileResponse {
	templateId: string | null;
	data: PortfolioData;
}

function hasContent(data: PortfolioData): boolean {
	return Boolean(data.profile.fullName) || (data.experience?.length ?? 0) > 0;
}

export function CreatePage() {
	const navigate = useNavigate();
	const draftTemplateId = useDraftStore((s) => s.templateId);
	const draftData = useDraftStore((s) => s.data);
	const setDraftData = useDraftStore((s) => s.setData);
	const setDraftTemplateId = useDraftStore((s) => s.setTemplateId);

	const [templateId, setTemplateId] = useState<string | null>(draftTemplateId);
	const [data, setData] = useState<PortfolioData>(draftData);
	const [loaded, setLoaded] = useState(false);
	const [stepIndex, setStepIndex] = useState(0);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		// Runs once on mount: reconcile the (possibly stale, pre-OAuth-redirect)
		// local draft against the account's saved profile.
		api
			.get<ProfileResponse>("/api/me/profile")
			.then((profile) => {
				const resolvedTemplateId = draftTemplateId ?? profile.templateId;
				if (!resolvedTemplateId) {
					navigate("/");
					return;
				}
				const resolvedData = hasContent(draftData) ? draftData : profile.data;
				setTemplateId(resolvedTemplateId);
				setData(resolvedData);
				setDraftTemplateId(resolvedTemplateId);
				setDraftData(resolvedData);
				setLoaded(true);
			})
			.catch(() => setLoaded(true));
		// Intentionally run once: this reconciles whatever localStorage/props
		// held at mount time, not a value this effect should re-run on.
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function updateData(updater: (prev: PortfolioData) => PortfolioData) {
		// setData's updater must stay pure — no side effects inside it, since
		// React may invoke it more than once. Compute `next` once here
		// instead, then apply it to both stores as separate, plain calls.
		const next = updater(data);
		setData(next);
		setDraftData(next);
	}

	async function persist() {
		if (!templateId) return;
		setSaving(true);
		try {
			await api.put("/api/me/profile", { templateId, data });
		} finally {
			setSaving(false);
		}
	}

	async function goToStep(index: number) {
		await persist();
		setStepIndex(index);
	}

	if (!loaded || !templateId) {
		return <div className="p-16 text-center text-sm text-muted-foreground">Loading…</div>;
	}

	const currentStep = WIZARD_STEPS[stepIndex];

	return (
		<div className="grid h-[calc(100svh-4rem)] grid-cols-1 lg:grid-cols-2">
			<div className="overflow-y-auto px-8 py-10">
				<ol className="mb-8 flex flex-wrap gap-2 text-sm">
					{WIZARD_STEPS.map((step, i) => (
						<li key={step.id}>
							<button
								type="button"
								onClick={() => void goToStep(i)}
								className={cn(
									"rounded-full px-3 py-1.5 transition-colors",
									i === stepIndex
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:text-foreground",
								)}
							>
								{step.label}
							</button>
						</li>
					))}
				</ol>

				{currentStep.id === "basics" && <BasicsStep data={data} onChange={updateData} />}
				{currentStep.id === "experience" && <ExperienceStep data={data} onChange={updateData} />}
				{currentStep.id === "projects" && <ProjectsStep data={data} onChange={updateData} />}
				{currentStep.id === "skills" && <SkillsStep data={data} onChange={updateData} />}
				{currentStep.id === "review" && <ReviewStep templateId={templateId} data={data} />}

				<div className="mt-8 flex justify-between">
					<Button variant="outline" disabled={stepIndex === 0} onClick={() => void goToStep(stepIndex - 1)}>
						Back
					</Button>
					{stepIndex < WIZARD_STEPS.length - 1 && (
						<Button onClick={() => void goToStep(stepIndex + 1)}>{saving ? "Saving…" : "Next"}</Button>
					)}
				</div>
			</div>
			<div className="hidden border-l border-border lg:block">
				<PortfolioPreview templateId={templateId} data={data} />
			</div>
		</div>
	);
}
