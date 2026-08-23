import { Children, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, usePrefersReducedMotion, isAlreadyInView } from "@/lib/gsap";

interface ScrollRevealProps {
	children: ReactNode;
	className?: string;
	/** Vertical offset the content rises from, in px. */
	y?: number;
	delay?: number;
}

/** Rises + fades in once its top edge crosses 85% of the viewport. Reduced-motion: renders in its end state. */
export function ScrollReveal({ children, className, y = 28, delay = 0 }: ScrollRevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	const reduced = usePrefersReducedMotion();

	useGSAP(
		() => {
			if (reduced || !ref.current) return;
			const fromVars = { opacity: 0, y };
			const toVars = { opacity: 1, y: 0, duration: 0.7, delay, ease: "power3.out" as const };

			// Already on screen (common for above-the-fold content, e.g. a
			// template detail page's info panel) — animate immediately rather
			// than gating on a ScrollTrigger the user may never cause to fire.
			if (isAlreadyInView(ref.current, 0.88)) {
				gsap.fromTo(ref.current, fromVars, toVars);
				return;
			}

			gsap.fromTo(ref.current, fromVars, {
				...toVars,
				scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
			});
		},
		{ scope: ref, dependencies: [reduced] },
	);

	return (
		<div ref={ref} className={className}>
			{children}
		</div>
	);
}

interface StaggerGridProps {
	children: ReactNode;
	className?: string;
	/** Selector (within this container) for the items to stagger — defaults to direct children. */
	itemSelector?: string;
	stagger?: number;
}

/** Like ScrollReveal, but staggers each matched child instead of animating the container as one block. */
export function StaggerGrid({ children, className, itemSelector = ":scope > *", stagger = 0.08 }: StaggerGridProps) {
	const ref = useRef<HTMLDivElement>(null);
	const reduced = usePrefersReducedMotion();
	// The items this wraps often arrive asynchronously (e.g. a template list
	// still loading) — re-run once the actual rendered count changes, not
	// just once on mount, or the query below can run against zero elements
	// and never get another chance to animate the real ones.
	const itemCount = Children.count(children);

	useGSAP(
		() => {
			if (reduced || !ref.current) return;
			const items = ref.current.querySelectorAll(itemSelector);
			if (items.length === 0) return;

			const fromVars = { opacity: 0, y: 24, scale: 0.97 };
			const toVars = { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" as const, stagger };

			if (isAlreadyInView(ref.current, 0.85)) {
				gsap.fromTo(items, fromVars, toVars);
				return;
			}

			gsap.fromTo(items, fromVars, {
				...toVars,
				scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
			});
		},
		{ scope: ref, dependencies: [reduced, itemSelector, itemCount] },
	);

	return (
		<div ref={ref} className={className}>
			{children}
		</div>
	);
}

/** Re-runs ScrollTrigger's measurements — call after content that affects layout height loads (e.g. images). */
export function refreshScrollTrigger(): void {
	ScrollTrigger.refresh();
}
