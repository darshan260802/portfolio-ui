import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
	children: ReactNode;
	className?: string;
	/** How far the button can be pulled toward the cursor, in px. */
	strength?: number;
}

/** Wraps a control (button/link) and pulls it gently toward the cursor within its bounds. */
export function MagneticButton({ children, className, strength = 14 }: MagneticButtonProps) {
	const ref = useRef<HTMLDivElement>(null);
	const reduced = usePrefersReducedMotion();
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const springX = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
	const springY = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		if (reduced || !ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		x.set(((e.clientX - rect.left) / rect.width - 0.5) * strength);
		y.set(((e.clientY - rect.top) / rect.height - 0.5) * strength);
	}

	function handleMouseLeave() {
		x.set(0);
		y.set(0);
	}

	return (
		<motion.div
			ref={ref}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			style={reduced ? undefined : { x: springX, y: springY }}
			className={cn("inline-block", className)}
		>
			{children}
		</motion.div>
	);
}
