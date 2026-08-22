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
			setTemplateId: (templateId) => set({ templateId }),
			setData: (data) => set({ data }),
			updateData: (updater) => set((s) => ({ data: updater(s.data) })),
			reset: () => set({ templateId: null, data: emptyPortfolioData }),
		}),
		{ name: "pb-draft" },
	),
);
