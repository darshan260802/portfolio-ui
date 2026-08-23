import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { useToastStore, type Toast, type ToastVariant } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

const ICON: Record<ToastVariant, typeof CheckCircle2> = {
	success: CheckCircle2,
	error: XCircle,
	info: Info,
	loading: Loader2,
};

const ICON_CLASS: Record<ToastVariant, string> = {
	success: "text-emerald-500",
	error: "text-destructive",
	info: "text-primary",
	loading: "text-muted-foreground animate-spin",
};

function ToastCard({ toast }: { toast: Toast }) {
	const dismiss = useToastStore((s) => s.dismiss);
	const Icon = ICON[toast.variant];

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 24, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
			transition={{ type: "spring", stiffness: 420, damping: 34 }}
			drag="x"
			dragConstraints={{ left: 0, right: 0 }}
			dragElastic={{ left: 0, right: 0.7 }}
			onDragEnd={(_e, info) => {
				if (info.offset.x > 80) dismiss(toast.id);
			}}
			role="status"
			aria-live="polite"
			className={cn(
				"pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-md",
			)}
		>
			<Icon className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_CLASS[toast.variant])} aria-hidden />
			<div className="flex-1 text-sm">
				<p className="font-medium text-foreground">{toast.title}</p>
				{toast.description && <p className="mt-0.5 text-muted-foreground">{toast.description}</p>}
			</div>
			<button
				type="button"
				onClick={() => dismiss(toast.id)}
				aria-label="Dismiss notification"
				className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<X className="h-4 w-4" />
			</button>
		</motion.div>
	);
}

/** Mount once, near the root of the app (see Layout.tsx). */
export function Toaster() {
	const toasts = useToastStore((s) => s.toasts);

	return (
		<div
			className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2 p-4 sm:bottom-4 sm:right-4 sm:p-0"
			aria-label="Notifications"
		>
			<AnimatePresence initial={false}>
				{toasts.map((t) => (
					<ToastCard key={t.id} toast={t} />
				))}
			</AnimatePresence>
		</div>
	);
}
