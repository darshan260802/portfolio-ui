import { useRef, useState } from "react";
import { gsap, useGSAP, usePrefersReducedMotion, isAlreadyInView } from "@/lib/gsap";

interface CounterProps {
	value: number;
	className?: string;
	prefix?: string;
	suffix?: string;
	duration?: number;
}

/** Counts up to `value` once it scrolls into view. Used for the dashboard's stat tiles. */
export function Counter({ value, className, prefix = "", suffix = "", duration = 1.1 }: CounterProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const reduced = usePrefersReducedMotion();
	const [display, setDisplay] = useState(reduced ? value : 0);

	useGSAP(
		() => {
			if (reduced) {
				setDisplay(value);
				return;
			}
			const proxy = { n: 0 };
			const tweenVars = {
				n: value,
				duration,
				ease: "power2.out" as const,
				onUpdate: () => setDisplay(Math.round(proxy.n)),
			};

			// Already on screen — count up immediately instead of gating on a
			// ScrollTrigger the user may never cause to fire. See
			// isAlreadyInView's jsdoc for why this matters.
			if (!ref.current || isAlreadyInView(ref.current, 0.9)) {
				gsap.to(proxy, tweenVars);
				return;
			}

			gsap.to(proxy, {
				...tweenVars,
				scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
			});
		},
		{ dependencies: [value, reduced] },
	);

	return (
		<span ref={ref} className={className}>
			{prefix}
			{display}
			{suffix}
		</span>
	);
}
