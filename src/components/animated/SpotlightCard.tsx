import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpotlightCardProps {
	children: ReactNode;
	className?: string;
}

/** A soft light that follows the cursor across the card surface — like inspecting a swatch under a desk lamp. */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
	const ref = useRef<HTMLDivElement>(null);

	function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
		const el = ref.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
		el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
	}

	return (
		<div
			ref={ref}
			onMouseMove={handleMouseMove}
			className={cn("group relative isolate overflow-hidden", className)}
		>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
				style={{
					background:
						"radial-gradient(280px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in oklch, var(--color-primary) 18%, transparent), transparent 70%)",
				}}
			/>
			{children}
		</div>
	);
}
