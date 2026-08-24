import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	/** Body copy. A node, not a string, so callers can include the live URL as a real link. */
	description: ReactNode;
	confirmLabel: string;
	cancelLabel?: string;
	confirmVariant?: ButtonProps["variant"];
	/** Optional third action rendered as a plain link-button (e.g. "Edit the existing one instead"). */
	secondary?: { label: string; onSelect: () => void };
	onConfirm: () => void;
	onCancel: () => void;
}

/**
 * A blocking yes/no for actions that overwrite something the user can't get
 * back by hitting Back — publishing over a live site, in particular. Small
 * and purpose-built rather than a general Dialog primitive: this app has
 * exactly one kind of modal, and a confirm is the one interaction where
 * getting focus and Escape handling right actually matters.
 */
export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel = "Cancel",
	confirmVariant = "destructive",
	secondary,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const confirmRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;

		// Focus the confirm button so the dialog is immediately operable by
		// keyboard, and remember where focus came from to restore it on close.
		const previouslyFocused = document.activeElement as HTMLElement | null;
		confirmRef.current?.focus();

		// The page behind a modal must not scroll — on iOS especially, a
		// scrollable body under an overlay is what makes a dialog feel broken.
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				event.stopPropagation();
				onCancel();
				return;
			}
			if (event.key !== "Tab") return;
			// Keep Tab inside the dialog: without this, focus walks into the
			// page behind it, which a screen reader then reads as if the
			// modal weren't there.
			const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
				'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
			);
			if (!focusable || focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = previousOverflow;
			previouslyFocused?.focus?.();
		};
	}, [open, onCancel]);

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
					onClick={onCancel}
				>
					<motion.div
						ref={panelRef}
						role="alertdialog"
						aria-modal="true"
						aria-labelledby="confirm-dialog-title"
						aria-describedby="confirm-dialog-description"
						// On phones this is a bottom sheet (thumb-reachable, full
						// width); from `sm` up it becomes a centered card.
						className={cn(
							"w-full max-w-lg rounded-t-xl border border-border bg-card p-6 shadow-lg",
							"sm:rounded-xl",
						)}
						initial={{ opacity: 0, y: 24, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 12, scale: 0.98 }}
						transition={{ duration: 0.18, ease: "easeOut" }}
						onClick={(e) => e.stopPropagation()}
					>
						<h2 id="confirm-dialog-title" className="font-display text-lg font-semibold tracking-tight">
							{title}
						</h2>
						<div id="confirm-dialog-description" className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{description}
						</div>

						<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
								{cancelLabel}
							</Button>
							{secondary && (
								<Button variant="ghost" onClick={secondary.onSelect} className="w-full sm:w-auto">
									{secondary.label}
								</Button>
							)}
							<Button ref={confirmRef} variant={confirmVariant} onClick={onConfirm} className="w-full sm:w-auto">
								{confirmLabel}
							</Button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
