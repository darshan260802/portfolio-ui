import { Flame, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Promotion } from "./promotions";

const STYLES: Record<Promotion, { label: string; icon: typeof Star; className: string }> = {
	// Amber is the palette's one warm accent, so "Featured" reads as a
	// highlight rather than another neutral chip.
	featured: { label: "Featured", icon: Star, className: "bg-accent text-accent-foreground" },
	// "Hot" needs to out-rank "Featured" at a glance, and deliberately does
	// NOT use the destructive token — that one means "something went wrong"
	// everywhere else in the app, and its value is free to change on that
	// basis. A literal orange stays put and reads correctly in both themes.
	hot: { label: "Hot", icon: Flame, className: "bg-orange-500 text-white" },
};

/** The pill overlaid on a promoted template's thumbnail. */
export function PromotionBadge({ promotion, className }: { promotion: Promotion; className?: string }) {
	const { label, icon: Icon, className: tone } = STYLES[promotion];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm",
				tone,
				className,
			)}
		>
			<Icon className="h-3 w-3 fill-current" aria-hidden />
			{label}
		</span>
	);
}
