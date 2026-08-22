import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useSession } from "@/lib/auth-client";

export function RequireAuth({ children }: { children: ReactNode }) {
	const { data: session, isPending } = useSession();
	const location = useLocation();

	if (isPending) return null;

	if (!session) {
		const next = encodeURIComponent(location.pathname + location.search);
		return <Navigate to={`/login?next=${next}`} replace />;
	}

	return children;
}
