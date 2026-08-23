import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single registration point for GSAP plugins — import from here (not
 * "gsap" directly) anywhere a component needs ScrollTrigger, so the plugin
 * is guaranteed registered before use regardless of import order.
 */
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
export { useGSAP } from "@gsap/react";

/**
 * Every animated component in src/components/animated/ checks this before
 * running motion — reduced-motion users get the end state immediately
 * instead of the animation.
 */
export function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(
		() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
	);

	useEffect(() => {
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		const handler = () => setReduced(mql.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	return reduced;
}
