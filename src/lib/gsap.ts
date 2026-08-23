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

/**
 * True if `el`'s top edge has already crossed the point `percent` of the
 * way down the viewport — i.e. whether a ScrollTrigger with
 * `start: "top {percent*100}%"` would already be past its trigger point
 * right now, without any further scrolling.
 *
 * Exists because of a real, reproduced bug: a `scrollTrigger: { once: true }`
 * reveal created on a COLD page load (web fonts/layout not yet settled) can
 * miscalculate its start position and never fire for content that's
 * already inside the viewport — the user never scrolls, so nothing ever
 * forces GSAP to recheck, and the content stays at its `opacity: 0` "from"
 * state forever (confirmed via a fresh page load to a page whose reveal
 * content sits above the fold: content stayed invisible until ANY scroll
 * event, which is exactly what forces ScrollTrigger to recompute).
 * Every scroll-reveal component checks this before deciding whether to
 * attach a ScrollTrigger at all — content already in view just animates
 * immediately, sidestepping the race entirely rather than depending on
 * ScrollTrigger's timing being correct at mount.
 */
export function isAlreadyInView(el: Element, percent: number): boolean {
	return el.getBoundingClientRect().top <= window.innerHeight * percent;
}
