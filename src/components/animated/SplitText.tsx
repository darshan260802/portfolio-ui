import { useRef, type ElementType } from "react";
import { gsap, useGSAP, usePrefersReducedMotion } from "@/lib/gsap";

interface SplitTextProps {
	text: string;
	as?: ElementType;
	className?: string;
	/** "chars" reads as a single word/short phrase assembling; "words" reads as a sentence building. */
	by?: "chars" | "words";
	delay?: number;
}

/**
 * Splits `text` into spans and animates them in on mount — the hero
 * headline "assembling" itself, in keeping with this app's Assembly
 * Canvas direction (a portfolio built from discrete typed blocks).
 * Renders the plain text immediately for reduced-motion users and for
 * anything that reads this node's textContent (SEO crawlers, etc.) since
 * the wrapping spans still concatenate to the same string.
 */
export function SplitText({ text, as: Tag = "span", className, by = "words", delay = 0 }: SplitTextProps) {
	const containerRef = useRef<HTMLElement>(null);
	const reduced = usePrefersReducedMotion();
	const pieces = by === "words" ? text.split(" ") : text.split("");

	useGSAP(
		() => {
			if (reduced || !containerRef.current) return;
			const targets = containerRef.current.querySelectorAll("[data-split-piece]");
			gsap.fromTo(
				targets,
				{ opacity: 0, y: "0.6em", rotateX: -40 },
				{
					opacity: 1,
					y: "0em",
					rotateX: 0,
					duration: 0.7,
					delay,
					ease: "power3.out",
					stagger: by === "words" ? 0.07 : 0.02,
				},
			);
		},
		{ scope: containerRef, dependencies: [text, reduced] },
	);

	return (
		<Tag ref={containerRef} className={className} style={{ perspective: "600px" }}>
			{pieces.map((piece, i) => (
				<span
					key={i}
					data-split-piece
					style={{ display: "inline-block", whiteSpace: piece === "" ? "pre" : undefined }}
				>
					{piece === "" ? " " : piece}
					{by === "words" && i < pieces.length - 1 ? " " : ""}
				</span>
			))}
		</Tag>
	);
}
