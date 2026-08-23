import { useRef } from "react";
import { gsap, useGSAP, usePrefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface GridCanvasProps {
	className?: string;
}

/**
 * The signature backdrop: the dot-grid working surface with two soft
 * light sources (violet + amber, the two brand accents) drifting slowly
 * across it — an ambient "someone's at the drafting table" presence
 * rather than a generic gradient blob. Absolutely positioned; the parent
 * needs `position: relative` and its own background color underneath.
 */
export function GridCanvas({ className }: GridCanvasProps) {
	const ref = useRef<HTMLDivElement>(null);
	const reduced = usePrefersReducedMotion();

	useGSAP(
		() => {
			if (reduced || !ref.current) return;
			const lights = ref.current.querySelectorAll<HTMLElement>("[data-light]");
			for (const [i, light] of lights.entries()) {
				gsap.to(light, {
					x: i === 0 ? "18vw" : "-16vw",
					y: i === 0 ? "-10vh" : "12vh",
					duration: 18 + i * 4,
					ease: "sine.inOut",
					repeat: -1,
					yoyo: true,
				});
			}
		},
		{ scope: ref, dependencies: [reduced] },
	);

	return (
		<div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
			<div className="bg-grid absolute inset-0" />
			<div
				data-light
				className="absolute -left-1/4 top-0 h-[60vw] w-[60vw] max-h-[560px] max-w-[560px] rounded-full opacity-25 blur-[100px]"
				style={{ background: "var(--color-primary)" }}
			/>
			<div
				data-light
				className="absolute -right-1/4 bottom-0 h-[50vw] w-[50vw] max-h-[480px] max-w-[480px] rounded-full opacity-20 blur-[100px]"
				style={{ background: "var(--color-accent)" }}
			/>
			<div
				className="absolute inset-0"
				style={{
					background: "linear-gradient(to bottom, transparent 0%, var(--color-background) 100%)",
				}}
			/>
		</div>
	);
}
