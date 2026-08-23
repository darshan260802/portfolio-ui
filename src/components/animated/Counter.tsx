import { useRef, useState } from "react";
import { gsap, useGSAP, usePrefersReducedMotion } from "@/lib/gsap";

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
			gsap.to(proxy, {
				n: value,
				duration,
				ease: "power2.out",
				scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
				onUpdate: () => setDisplay(Math.round(proxy.n)),
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
