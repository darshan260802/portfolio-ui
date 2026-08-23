import { create } from "zustand";

/**
 * Global toast queue. This exists because API failures were previously
 * invisible to the user — e.g. CreatePage.persist() had no `catch` at all,
 * so a 400 from PUT /api/me/profile vanished silently and the wizard
 * advanced anyway. Every mutating call site now routes its error through
 * `toast.error(...)` (see lib/api-error.ts for turning an ApiError into
 * readable text) so a failure is always visible, not just logged.
 */
export type ToastVariant = "success" | "error" | "info" | "loading";

export interface Toast {
	id: string;
	variant: ToastVariant;
	title: string;
	description?: string;
	/** ms until auto-dismiss; 0/undefined = stays until dismissed (used for "loading"). */
	duration?: number;
}

interface ToastState {
	toasts: Toast[];
	push: (toast: Omit<Toast, "id">) => string;
	update: (id: string, patch: Partial<Omit<Toast, "id">>) => void;
	dismiss: (id: string) => void;
}

const DEFAULT_DURATION: Record<ToastVariant, number | undefined> = {
	success: 4000,
	info: 4000,
	error: 6000,
	loading: undefined,
};

export const useToastStore = create<ToastState>()((set) => ({
	toasts: [],
	push: (toast) => {
		const id = crypto.randomUUID();
		const duration = toast.duration ?? DEFAULT_DURATION[toast.variant];
		set((s) => ({ toasts: [...s.toasts, { ...toast, id, duration }] }));
		if (duration) {
			setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration);
		}
		return id;
	},
	update: (id, patch) => {
		set((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
		const duration = patch.duration ?? (patch.variant ? DEFAULT_DURATION[patch.variant] : undefined);
		if (duration) {
			setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration);
		}
	},
	dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

function push(toast: Omit<Toast, "id">): string {
	return useToastStore.getState().push(toast);
}

/**
 * Plain function API — usable from event handlers, hooks, anywhere, no
 * need to be inside a component that subscribes to the store.
 */
export const toast = {
	success: (title: string, description?: string) => push({ variant: "success", title, description }),
	error: (title: string, description?: string) => push({ variant: "error", title, description }),
	info: (title: string, description?: string) => push({ variant: "info", title, description }),
	/** Returns the toast id — pass it to toast.resolve/toast.fail to update it in place. */
	loading: (title: string, description?: string) => push({ variant: "loading", title, description }),
	resolve: (id: string, title: string, description?: string) =>
		useToastStore.getState().update(id, { variant: "success", title, description }),
	fail: (id: string, title: string, description?: string) =>
		useToastStore.getState().update(id, { variant: "error", title, description }),
	dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
