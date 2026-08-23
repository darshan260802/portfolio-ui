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

/** A real sequence a build goes through — queued, building, then live or failed. */
export function DeploymentTimeline({ status }: { status: DeploymentStatus }) {
	const failed = status === "FAILED";
	const currentRank = STAGE_RANK[status];

	return (
		<ol className="flex items-center gap-2">
			{STAGES.map((stage, i) => {
				const stageFailed = failed && i === STAGES.length - 1;
				const isDone = i < currentRank || (i === currentRank && status === "LIVE");
				const isActive = i === currentRank && status !== "LIVE" && !failed;

				return (
					<li key={stage.status} className="flex items-center gap-2">
						<span
							className={cn(
								"flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-colors",
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
								"text-xs",
								isActive || isDone ? "text-foreground" : "text-muted-foreground",
								stageFailed && "text-destructive",
							)}
						>
							{stageFailed ? "Failed" : stage.label}
						</span>
						{i < STAGES.length - 1 && (
							<div className="relative h-px w-8 bg-border">
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
