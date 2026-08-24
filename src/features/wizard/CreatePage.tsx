import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Monitor, Smartphone, Tablet, TriangleAlert } from "lucide-react";
import type { PortfolioData } from "@pb/templates";
import { api } from "@/lib/api";
import { apiErrorFields, formatApiError } from "@/lib/api-error";
import { toast } from "@/lib/toast-store";
import { useDraftStore } from "@/lib/draft-store";
import { PortfolioPreview } from "@/features/preview/PortfolioPreview";
import { WIZARD_STEPS, type WizardStepId } from "./steps";
import { validateStep, type FieldErrors } from "./validation";
import { WizardStepper } from "./WizardStepper";
import { BasicsStep } from "./BasicsStep";
import { ExperienceStep } from "./ExperienceStep";
import { ProjectsStep } from "./ProjectsStep";
import { SkillsStep } from "./SkillsStep";
import { ReviewStep } from "./ReviewStep";
import { Button } from "@/components/ui/button";
import { DraftConflictPrompt, type DraftCandidate } from "./DraftConflictPrompt";
import { cn } from "@/lib/utils";

interface ProfileResponse {
	templateId: string | null;
	data: PortfolioData;
	/** ISO timestamp of the last save, or null if this account has no profile yet. */
	updatedAt: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const DEVICE_WIDTHS = { desktop: "100%", tablet: "48rem", mobile: "24rem" } as const;
type DeviceMode = keyof typeof DEVICE_WIDTHS;

function hasContent(data: PortfolioData): boolean {
	return Boolean(data.profile.fullName) || (data.experience?.length ?? 0) > 0;
}

export function CreatePage() {
	const navigate = useNavigate();
	const draftTemplateId = useDraftStore((s) => s.templateId);
	const draftData = useDraftStore((s) => s.data);
	const draftUpdatedAt = useDraftStore((s) => s.updatedAt);
	const setDraftData = useDraftStore((s) => s.setData);
	const setDraftTemplateId = useDraftStore((s) => s.setTemplateId);

	const [templateId, setTemplateId] = useState<string | null>(draftTemplateId);
	const [data, setData] = useState<PortfolioData>(draftData);
	const [loaded, setLoaded] = useState(false);
	const [conflict, setConflict] = useState<{ local: DraftCandidate; server: DraftCandidate } | null>(null);
	const [stepIndex, setStepIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [saveState, setSaveState] = useState<SaveState>("idle");
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [device, setDevice] = useState<DeviceMode>("desktop");

	useEffect(() => {
		// Runs once on mount: reconcile the (possibly stale, pre-OAuth-redirect)
		// local draft against the account's saved profile.
		api
			.get<ProfileResponse>("/api/me/profile")
			.then((profile) => {
				// Both sides have real content, and they disagree — the local
				// draft could be from a different device/browser than the one
				// that last saved this account, so silently picking one would
				// quietly throw the other away. Ask instead of guessing.
				if (
					draftTemplateId &&
					profile.templateId &&
					hasContent(draftData) &&
					hasContent(profile.data) &&
					JSON.stringify(draftData) !== JSON.stringify(profile.data)
				) {
					setConflict({
						local: { templateId: draftTemplateId, data: draftData, updatedAt: draftUpdatedAt },
						server: {
							templateId: profile.templateId,
							data: profile.data,
							updatedAt: profile.updatedAt ? Date.parse(profile.updatedAt) : null,
						},
					});
					setLoaded(true);
					return;
				}

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
			.catch((err: unknown) => {
				toast.error("Couldn't load your portfolio", formatApiError(err));
				setLoaded(true);
			});
		// Intentionally run once: this reconciles whatever localStorage/props
		// held at mount time, not a value this effect should re-run on.
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function resolveConflict(choice: "local" | "server") {
		if (!conflict) return;
		const { templateId: chosenTemplateId, data: chosenData } = conflict[choice];
		setTemplateId(chosenTemplateId);
		setData(chosenData);
		setDraftTemplateId(chosenTemplateId);
		setDraftData(chosenData);
		setConflict(null);
	}

	function updateData(updater: (prev: PortfolioData) => PortfolioData) {
		// setData's updater must stay pure — no side effects inside it, since
		// React may invoke it more than once. Compute `next` once here
		// instead, then apply it to both stores as separate, plain calls.
		const next = updater(data);
		setData(next);
		setDraftData(next);
		if (saveState !== "idle") setSaveState("idle");
	}

	/**
	 * Saves to the server. Returns whether it succeeded — callers use this to
	 * decide whether to advance.
	 *
	 * `override` exists for a caller that has just produced new data and needs
	 * THAT saved, not what's in state: `setData` doesn't mutate the `data`
	 * binding this closure captured, so a save triggered in the same tick as a
	 * change would otherwise persist the value the user just replaced. The
	 * upload fields' Remove button is the case that needs it — it clears a
	 * field and saves in one gesture.
	 */
	async function persist(override?: PortfolioData): Promise<boolean> {
		if (!templateId) return false;
		setSaveState("saving");
		try {
			await api.put("/api/me/profile", { templateId, data: override ?? data });
			setSaveState("saved");
			setFieldErrors({});
			return true;
		} catch (err) {
			setSaveState("error");
			setFieldErrors((prev) => ({ ...prev, ...apiErrorFields(err) }));
			toast.error("Couldn't save your changes", formatApiError(err));
			return false;
		}
	}

	async function goToStep(index: number) {
		const currentStep = WIZARD_STEPS[stepIndex];
		const movingForward = index > stepIndex;

		// Moving forward: block on client-side validation for the step the
		// user is leaving, so an obviously incomplete step (e.g. missing full
		// name) never even reaches the API. Moving backward is always
		// allowed — the user may be going back specifically to fix something
		// a later step's save just failed on.
		if (movingForward) {
			const errors = validateStep(data, currentStep.id);
			if (Object.keys(errors).length > 0) {
				setFieldErrors(errors);
				toast.error("Fix the highlighted fields before continuing");
				return;
			}
		}

		const ok = await persist();
		if (ok || !movingForward) {
			setDirection(index > stepIndex ? 1 : -1);
			setStepIndex(index);
		}
	}

	const stepsWithErrors = useMemo(() => {
		const set = new Set<WizardStepId>();
		for (const path of Object.keys(fieldErrors)) {
			const topKey = path.split(".")[0];
			const step = WIZARD_STEPS.find((s) => s.id === topKey || (topKey === "profile" && s.id === "basics"));
			if (step) set.add(step.id);
		}
		return set;
	}, [fieldErrors]);

	if (conflict) {
		return (
			<div className="h-full overflow-y-auto">
				<DraftConflictPrompt local={conflict.local} server={conflict.server} onChoose={resolveConflict} />
			</div>
		);
	}

	if (!loaded || !templateId) {
		return (
			<div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading your portfolio…
			</div>
		);
	}

	const currentStep = WIZARD_STEPS[stepIndex];
	const isLastStep = stepIndex === WIZARD_STEPS.length - 1;

	return (
		<div className="grid h-full grid-cols-1 lg:grid-cols-2">
			<div className="flex h-full flex-col">
				<div className="border-b border-border/70 px-4 py-4 sm:px-8 sm:py-5">
					<WizardStepper
						steps={WIZARD_STEPS}
						currentIndex={stepIndex}
						onStepClick={(i) => void goToStep(i)}
						stepsWithErrors={stepsWithErrors}
					/>
				</div>

				<div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
					<AnimatePresence mode="wait" custom={direction} initial={false}>
						<motion.div
							key={currentStep.id}
							custom={direction}
							initial={{ opacity: 0, x: direction * 24 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: direction * -24 }}
							transition={{ duration: 0.22, ease: "easeOut" }}
						>
							{currentStep.id === "basics" && (
								<BasicsStep
									data={data}
									onChange={updateData}
									errors={fieldErrors}
									onSave={persist}
								/>
							)}
							{currentStep.id === "experience" && (
								<ExperienceStep data={data} onChange={updateData} errors={fieldErrors} />
							)}
							{currentStep.id === "projects" && (
								<ProjectsStep data={data} onChange={updateData} errors={fieldErrors} />
							)}
							{currentStep.id === "skills" && (
								<SkillsStep data={data} onChange={updateData} errors={fieldErrors} />
							)}
							{currentStep.id === "review" && <ReviewStep templateId={templateId} data={data} />}
						</motion.div>
					</AnimatePresence>
				</div>

				<div className="flex items-center justify-between border-t border-border/70 px-4 py-3 sm:px-8 sm:py-4">
					<Button variant="outline" disabled={stepIndex === 0} onClick={() => void goToStep(stepIndex - 1)}>
						Back
					</Button>
					<div className="flex items-center gap-4">
						<SaveIndicator state={saveState} />
						{!isLastStep && (
							<Button onClick={() => void goToStep(stepIndex + 1)} disabled={saveState === "saving"}>
								{saveState === "saving" ? "Saving…" : "Next"}
							</Button>
						)}
					</div>
				</div>
			</div>

			<div className="hidden flex-col border-l border-border/70 bg-muted/30 lg:flex">
				<div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5">
					<span className="build-tag">Live preview</span>
					<div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
						{(
							[
								{ mode: "desktop", icon: Monitor, label: "Desktop" },
								{ mode: "tablet", icon: Tablet, label: "Tablet" },
								{ mode: "mobile", icon: Smartphone, label: "Mobile" },
							] as const
						).map(({ mode, icon: Icon, label }) => (
							<button
								key={mode}
								type="button"
								onClick={() => setDevice(mode)}
								aria-label={label}
								aria-pressed={device === mode}
								className={cn(
									"flex h-6 w-6 items-center justify-center rounded transition-colors",
									device === mode
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<Icon className="h-3.5 w-3.5" />
							</button>
						))}
					</div>
				</div>
				<div className="flex flex-1 items-center justify-center overflow-hidden p-6">
					<motion.div
						animate={{ width: DEVICE_WIDTHS[device] }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="h-full max-w-full overflow-hidden rounded-lg border border-border bg-white shadow-md"
					>
						<PortfolioPreview templateId={templateId} data={data} />
					</motion.div>
				</div>
			</div>
		</div>
	);
}

function SaveIndicator({ state }: { state: SaveState }) {
	if (state === "idle") return null;
	if (state === "saving") {
		return (
			<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
			</span>
		);
	}
	if (state === "saved") {
		return (
			<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Check className="h-3.5 w-3.5 text-emerald-500" /> Saved
			</span>
		);
	}
	return (
		<span className="flex items-center gap-1.5 text-xs text-destructive">
			<TriangleAlert className="h-3.5 w-3.5" /> Not saved
		</span>
	);
}
