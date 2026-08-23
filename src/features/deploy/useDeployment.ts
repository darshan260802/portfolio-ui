import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatApiError } from "@/lib/api-error";
import { toast } from "@/lib/toast-store";

export type DeploymentStatus = "QUEUED" | "BUILDING" | "LIVE" | "FAILED";

interface DeploymentState {
	id: string;
	status: DeploymentStatus;
	log: string | null;
	url: string | null;
}

const POLL_INTERVAL_MS = 1500;
// ~5 minutes of polling at 1.5s — comfortably longer than BUILD_TIMEOUT_MS
// (120s server-side default) plus queueing time. Previously this retried
// on every failed poll forever with no cap, so a persistent network issue
// (or the deployment row genuinely disappearing) spun silently forever.
const MAX_CONSECUTIVE_POLL_FAILURES = 20;

/**
 * Starts and tracks one deployment. Surfaces failures via toast (both a
 * failed "start" call and giving up on polling after repeated failures) —
 * callers only need to render `deployment.status` and `startError` for
 * inline detail; they don't have to remember to toast themselves.
 */
export function useDeployment() {
	const [deployment, setDeployment] = useState<DeploymentState | null>(null);
	const [starting, setStarting] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const consecutiveFailuresRef = useRef(0);

	// A plain (hoisted) function declaration, not a const/useCallback — that
	// sidesteps any self-reference TDZ concern for the recursive setTimeout
	// call below. It doesn't need referential stability: nothing depends on
	// it across renders, it's only ever called from a user action or its own
	// scheduled timeout.
	function poll(id: string) {
		api
			.get<DeploymentState>(`/api/deployments/${id}`)
			.then((res) => {
				consecutiveFailuresRef.current = 0;
				setDeployment(res);
				if (res.status === "QUEUED" || res.status === "BUILDING") {
					pollTimeoutRef.current = setTimeout(() => poll(id), POLL_INTERVAL_MS);
				} else if (res.status === "FAILED") {
					toast.error("Build failed", res.log ? res.log.slice(0, 200) : "Check the build log for details.");
				} else if (res.status === "LIVE") {
					toast.success("Your portfolio is live", res.url ?? undefined);
				}
			})
			.catch(() => {
				consecutiveFailuresRef.current += 1;
				if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_POLL_FAILURES) {
					toast.error(
						"Lost track of your deployment",
						"We couldn't reach the server to check its status. Refresh to check again.",
					);
					return;
				}
				pollTimeoutRef.current = setTimeout(() => poll(id), POLL_INTERVAL_MS);
			});
	}

	async function deploy(body: { slug?: string; templateId?: string }) {
		setStarting(true);
		setStartError(null);
		try {
			const res = await api.post<{ deploymentId: string }>("/api/deploy", body);
			consecutiveFailuresRef.current = 0;
			setDeployment({ id: res.deploymentId, status: "QUEUED", log: null, url: null });
			poll(res.deploymentId);
		} catch (err) {
			const message = formatApiError(err);
			setStartError(message);
			toast.error("Couldn't start the build", message);
		} finally {
			setStarting(false);
		}
	}

	useEffect(() => {
		return () => {
			if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
		};
	}, []);

	return { deployment, starting, startError, deploy };
}
