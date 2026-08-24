import { motion } from "motion/react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "./useDeployment";

const STAGES: { status: DeploymentStatus; label: string }[] = [
	{ status: "QUEUED", label: "Queued" },
	{ status: "BUILDING", label: "Building" },
	{ status: "LIVE", label: "Live" },
];

const STAGE_RANK: Record<DeploymentStatus, number> = { QUEUED: 0, BUILDING: 1, LIVE: 2, FAILED: 2 };

/**
 * A real sequence a build goes through — queued, building, then live or failed.
 *
 * Sized to survive a phone: this renders inside a card inside a padded
 * column, so the usable width is barely 260px at 360px viewport. The
 * markers and type step down below `sm`, the connectors flex rather than
 * sitting at a fixed 2rem, and the row wraps as a last resort — with fixed
 * widths the final "Live" stage simply ran off the right edge and took the
 * whole page's horizontal scroll with it.
 */
export function DeploymentTimeline({ status }: { status: DeploymentStatus }) {
	const failed = status === "FAILED";
	const currentRank = STAGE_RANK[status];

	return (
		<ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 sm:gap-x-2">
			{STAGES.map((stage, i) => {
				const stageFailed = failed && i === STAGES.length - 1;
				const isDone = i < currentRank || (i === currentRank && status === "LIVE");
				const isActive = i === currentRank && status !== "LIVE" && !failed;

				return (
					<li key={stage.status} className="flex min-w-0 flex-1 items-center gap-1.5 last:flex-none sm:gap-2">
						<span
							className={cn(
								"flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors sm:h-6 sm:w-6 sm:text-xs",
								stageFailed && "border-destructive bg-destructive/10 text-destructive",
								isDone && !stageFailed && "border-primary bg-primary text-primary-foreground",
								isActive && "border-primary text-primary",
								!isDone && !isActive && !stageFailed && "border-border text-muted-foreground",
							)}
						>
							{stageFailed ? (
								<TriangleAlert className="h-3 w-3" />
							) : isActive ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : isDone ? (
								<Check className="h-3 w-3" />
							) : null}
						</span>
						<span
							className={cn(
								"whitespace-nowrap text-[11px] sm:text-xs",
								isActive || isDone ? "text-foreground" : "text-muted-foreground",
								stageFailed && "text-destructive",
							)}
						>
							{stageFailed ? "Failed" : stage.label}
						</span>
						{i < STAGES.length - 1 && (
							<div className="relative h-px min-w-2 flex-1 bg-border sm:min-w-4">
								<motion.div
									className="absolute inset-y-0 left-0 bg-primary"
									initial={false}
									animate={{ width: i < currentRank ? "100%" : "0%" }}
									transition={{ duration: 0.3 }}
								/>
							</div>
						)}
					</li>
				);
			})}
		</ol>
	);
}
