import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, usePrefersReducedMotion } from "@/lib/gsap";

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
			gsap.fromTo(
				ref.current,
				{ opacity: 0, y },
				{
					opacity: 1,
					y: 0,
					duration: 0.7,
					delay,
					ease: "power3.out",
					scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
				},
			);
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

	useGSAP(
		() => {
			if (reduced || !ref.current) return;
			const items = ref.current.querySelectorAll(itemSelector);
			gsap.fromTo(
				items,
				{ opacity: 0, y: 24, scale: 0.97 },
				{
					opacity: 1,
					y: 0,
					scale: 1,
					duration: 0.6,
					ease: "power3.out",
					stagger,
					scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
				},
			);
		},
		{ scope: ref, dependencies: [reduced, itemSelector] },
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
