import type { ReactNode } from "react";
import { motion } from "motion/react";
import { GridCanvas } from "@/components/animated/GridCanvas";
import { usePrefersReducedMotion } from "@/lib/gsap";

/** Shared backdrop + entrance animation for login/signup/forgot/reset — one visual identity for the whole auth flow. */
export function AuthShell({ children }: { children: ReactNode }) {
	const reduced = usePrefersReducedMotion();

	return (
		<div className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-6 py-16">
			<GridCanvas />
			<motion.div
				initial={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="relative w-full max-w-sm"
			>
				{children}
			</motion.div>
		</div>
	);
}
