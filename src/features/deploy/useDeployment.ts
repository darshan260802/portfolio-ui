import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export type DeploymentStatus = "QUEUED" | "BUILDING" | "LIVE" | "FAILED";

interface DeploymentState {
	id: string;
	status: DeploymentStatus;
	log: string | null;
	url: string | null;
}

const POLL_INTERVAL_MS = 1500;

export function useDeployment() {
	const [deployment, setDeployment] = useState<DeploymentState | null>(null);
	const [starting, setStarting] = useState(false);
	const [startError, setStartError] = useState<string | null>(null);
	const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// A plain (hoisted) function declaration, not a const/useCallback — that
	// sidesteps any self-reference TDZ concern for the recursive setTimeout
	// call below. It doesn't need referential stability: nothing depends on
	// it across renders, it's only ever called from a user action or its own
	// scheduled timeout.
	function poll(id: string) {
		api
			.get<DeploymentState>(`/api/deployments/${id}`)
			.then((res) => {
				setDeployment(res);
				if (res.status === "QUEUED" || res.status === "BUILDING") {
					pollTimeoutRef.current = setTimeout(() => poll(id), POLL_INTERVAL_MS);
				}
			})
			.catch(() => {
				pollTimeoutRef.current = setTimeout(() => poll(id), POLL_INTERVAL_MS);
			});
	}

	async function deploy(body: { slug?: string; templateId?: string }) {
		setStarting(true);
		setStartError(null);
		try {
			const res = await api.post<{ deploymentId: string }>("/api/deploy", body);
			setDeployment({ id: res.deploymentId, status: "QUEUED", log: null, url: null });
			poll(res.deploymentId);
		} catch (err) {
			setStartError((err as Error).message);
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
