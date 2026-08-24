import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyPortfolioData, type PortfolioData } from "@pb/templates";

/**
 * The in-progress wizard draft, persisted to localStorage. This — not
 * React state — is what makes the flow survive a full-page redirect: a
 * logged-out user picks a template, we stash templateId + whatever they've
 * typed so far here, send them to /login?next=/create, and a Google/GitHub
 * OAuth round-trip (or a plain email/password submit) reloads the page but
 * this store rehydrates from localStorage before the wizard mounts.
 */
interface DraftState {
	templateId: string | null;
	data: PortfolioData;
	/**
	 * When this device's draft content last changed, as an epoch ms value
	 * (null if it never has). Only content edits bump it — picking a
	 * template doesn't, since that alone isn't a draft worth preserving.
	 * The wizard shows it beside the account's saved-at time when it has to
	 * ask which of the two versions to keep.
	 */
	updatedAt: number | null;
	setTemplateId: (id: string | null) => void;
	setData: (data: PortfolioData) => void;
	updateData: (updater: (data: PortfolioData) => PortfolioData) => void;
	reset: () => void;
}

export const useDraftStore = create<DraftState>()(
	persist(
		(set) => ({
			templateId: null,
			data: emptyPortfolioData,
			updatedAt: null,
			setTemplateId: (templateId) => set({ templateId }),
			setData: (data) => set({ data, updatedAt: Date.now() }),
			updateData: (updater) => set((s) => ({ data: updater(s.data), updatedAt: Date.now() })),
			reset: () => set({ templateId: null, data: emptyPortfolioData, updatedAt: null }),
		}),
		{ name: "pb-draft" },
	),
);
