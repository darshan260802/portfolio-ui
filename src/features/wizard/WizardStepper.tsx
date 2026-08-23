import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardStepId } from "./steps";

interface WizardStepperProps {
	steps: readonly { id: WizardStepId; label: string }[];
	currentIndex: number;
	onStepClick: (index: number) => void;
	/** Which step ids currently have unresolved field errors — shown as a small red dot. */
	stepsWithErrors: Set<WizardStepId>;
}

/**
 * A real numbered sequence (Basics → Review is a fixed order the user
 * progresses through), so numbered markers earn their place here — unlike
 * a decorative "01 / 02 / 03" applied to unordered content.
 */
export function WizardStepper({ steps, currentIndex, onStepClick, stepsWithErrors }: WizardStepperProps) {
	return (
		<ol className="flex items-center">
			{steps.map((step, i) => {
				const isComplete = i < currentIndex;
				const isCurrent = i === currentIndex;
				const hasError = stepsWithErrors.has(step.id);

				return (
					<li key={step.id} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
						<button
							type="button"
							onClick={() => onStepClick(i)}
							className="group flex flex-col items-center gap-2"
							aria-current={isCurrent ? "step" : undefined}
						>
							<span className="relative flex items-center justify-center">
								<span
									className={cn(
										"flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs font-medium transition-colors",
										isComplete && "border-primary bg-primary text-primary-foreground",
										isCurrent && "border-primary text-primary",
										!isComplete && !isCurrent && "border-border text-muted-foreground group-hover:border-foreground/40",
									)}
								>
									{isComplete ? <Check className="h-3.5 w-3.5" /> : i + 1}
								</span>
								{isCurrent && (
									<motion.span
										layoutId="wizard-step-ring"
										className="absolute inset-0 rounded-full ring-2 ring-primary/30"
										transition={{ type: "spring", stiffness: 400, damping: 32 }}
									/>
								)}
								{hasError && (
									<span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
								)}
							</span>
							<span
								className={cn(
									"hidden text-xs transition-colors sm:block",
									isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
								)}
							>
								{step.label}
							</span>
						</button>

						{i < steps.length - 1 && (
							<div className="relative mx-2 h-px flex-1 bg-border">
								<motion.div
									className="absolute inset-y-0 left-0 bg-primary"
									initial={false}
									animate={{ width: i < currentIndex ? "100%" : "0%" }}
									transition={{ duration: 0.35, ease: "easeOut" }}
								/>
							</div>
						)}
					</li>
				);
			})}
		</ol>
	);
}
