import { useCallback, useEffect, useState } from "react";
import type { PortfolioData } from "@pb/templates";
import { api } from "@/lib/api";
import { formatApiError } from "@/lib/api-error";
import { toast } from "@/lib/toast-store";

/**
 * The two modes templates actually render differently. "system" is a valid
 * schema value but no template branches on it (each checks for exactly
 * `theme.mode === "dark"` or `=== "light"`), so exposing it here would be a
 * control that does nothing — same reasoning as the wizard's Basics step.
 */
export type ThemeMode = "light" | "dark";

interface ProfileResponse {
	templateId: string | null;
	data: PortfolioData;
	updatedAt: string | null;
}

/**
 * Reads and writes the published portfolio's light/dark mode.
 *
 * This is the *site's* appearance, not the builder UI's — it's the same
 * `theme.mode` the wizard's Basics step sets, surfaced next to the template
 * switcher in Settings so changing how the published site looks doesn't
 * mean walking back through the whole wizard. The caller redeploys after a
 * successful save; nothing changes on the live site until it does.
 */
export function useAppearance() {
	/** undefined while loading. */
	const [mode, setMode] = useState<ThemeMode | undefined>(undefined);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let cancelled = false;
		api
			.get<ProfileResponse>("/api/me/profile")
			.then((profile) => {
				if (!cancelled) setMode(profile.data.theme?.mode === "dark" ? "dark" : "light");
			})
			.catch(() => {
				// Templates treat "anything but dark" as light, so that's the
				// honest fallback for a profile we couldn't read — and `save`
				// re-reads before writing anyway, so a wrong guess here can't
				// be persisted.
				if (!cancelled) setMode("light");
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const save = useCallback(async (next: ThemeMode): Promise<boolean> => {
		setSaving(true);
		try {
			// Re-read immediately before writing. PUT /api/me/profile replaces
			// the whole document, so patching the copy fetched at mount would
			// silently roll back anything the wizard saved in another tab
			// since this page was opened.
			const profile = await api.get<ProfileResponse>("/api/me/profile");
			await api.put("/api/me/profile", {
				...(profile.templateId ? { templateId: profile.templateId } : {}),
				data: { ...profile.data, theme: { ...profile.data.theme, mode: next } },
			});
			setMode(next);
			return true;
		} catch (err) {
			toast.error("Couldn't change the appearance", formatApiError(err));
			return false;
		} finally {
			setSaving(false);
		}
	}, []);

	return { mode, saving, save };
}
