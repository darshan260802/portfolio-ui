/**
 * Template ids to surface with a "Featured" star badge in the gallery and
 * on the template detail page.
 *
 * This lives in the web app rather than in each template's manifest on
 * purpose: "featured" is an editorial, time-bound call ("this one is new,
 * point people at it"), not a property of the template itself. Keeping it
 * here means promoting or retiring a template is a one-line change in the
 * app, with no @pb/templates rebuild or lockfile bump — and the badge can
 * never end up baked into an exported/hosted portfolio, which has no
 * concept of a gallery.
 *
 * Add an id to feature it; remove it when it's no longer new.
 */
export const FEATURED_TEMPLATE_IDS: ReadonlySet<string> = new Set(["atlas"]);

export function isFeatured(templateId: string): boolean {
	return FEATURED_TEMPLATE_IDS.has(templateId);
}
