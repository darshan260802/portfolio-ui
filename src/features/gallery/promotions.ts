import type { TemplateManifest } from "@pb/templates";

export type Promotion = "hot" | "featured";

/**
 * Templates to surface ahead of the rest, and the badge each one wears.
 *
 * This lives in the web app rather than in each template's manifest on
 * purpose: promotion is an editorial, time-bound call ("this one is new,
 * point people at it"), not a property of the template itself. Keeping it
 * here means promoting or retiring a template is a one-line change in the
 * app, with no @pb/templates rebuild or lockfile bump — and a badge can
 * never end up baked into an exported or hosted portfolio, which has no
 * concept of a gallery.
 *
 * Insertion order is the display order: whatever is listed first here is
 * the first card in the gallery. Everything not listed keeps the order the
 * API returned it in, after the promoted ones.
 */
export const PROMOTED_TEMPLATES: ReadonlyMap<string, Promotion> = new Map([
	["instrument", "hot"],
	["atlas", "featured"],
]);

export function promotionOf(templateId: string): Promotion | null {
	return PROMOTED_TEMPLATES.get(templateId) ?? null;
}

/**
 * Promoted templates first, in the order PROMOTED_TEMPLATES declares them,
 * then everything else untouched.
 *
 * Sorts a copy, and compares by looked-up rank rather than mutating or
 * relying on the input order for ties — Array#sort is only guaranteed
 * stable for equal keys, and giving every unpromoted template the same
 * rank is precisely what keeps the API's own ordering intact among them.
 */
export function withPromotedFirst(templates: TemplateManifest[]): TemplateManifest[] {
	const order = [...PROMOTED_TEMPLATES.keys()];
	const rank = (id: string) => {
		const i = order.indexOf(id);
		return i === -1 ? order.length : i;
	};
	return [...templates].sort((a, b) => rank(a.id) - rank(b.id));
}
