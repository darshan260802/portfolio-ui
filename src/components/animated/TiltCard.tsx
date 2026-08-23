import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface TiltCardProps {
	children: ReactNode;
	className?: string;
	/** Max rotation in degrees. */
	max?: number;
}

/**
 * Tilts toward the cursor in 3D, like picking up a physical template swatch
 * to catch the light — a deliberate hover moment for the gallery's template
 * cards, not applied everywhere.
 */
export function TiltCard({ children, className, max = 8 }: TiltCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const reduced = usePrefersReducedMotion();

	const px = useMotionValue(0.5);
	const py = useMotionValue(0.5);
	const springX = useSpring(px, { stiffness: 300, damping: 28 });
	const springY = useSpring(py, { stiffness: 300, damping: 28 });
	const rotateX = useTransform(springY, [0, 1], [max, -max]);
	const rotateY = useTransform(springX, [0, 1], [-max, max]);

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		if (reduced || !ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		px.set((e.clientX - rect.left) / rect.width);
		py.set((e.clientY - rect.top) / rect.height);
	}

	function handleMouseLeave() {
		px.set(0.5);
		py.set(0.5);
	}

	return (
		<motion.div
			ref={ref}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 800 }}
			className={cn("will-change-transform", className)}
		>
			{children}
		</motion.div>
	);
}
