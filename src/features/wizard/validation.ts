import { portfolioDataSchema, type PortfolioData } from "@pb/templates";
import type { WizardStepId } from "./steps";

/**
 * Client-side validation for the wizard. Reuses `portfolioDataSchema` —
 * the exact schema the API validates against (see portfolio-builder-api's
 * routes/profile.ts) — so "valid on the client" and "valid on the server"
 * can never drift apart. Error paths are dotted strings ("profile.fullName",
 * "experience.0.role") matching the API's `toFieldErrors` shape, so the
 * same `errors` prop works whether the message came from a local
 * `safeParse` or from a rejected PUT /api/me/profile.
 */

export type FieldErrors = Record<string, string>;

function flatten(data: PortfolioData): FieldErrors {
	const result = portfolioDataSchema.safeParse(data);
	if (result.success) return {};

	const fields: FieldErrors = {};
	for (const issue of result.error.issues) {
		const path = issue.path.join(".") || "_root";
		if (!(path in fields)) fields[path] = issue.message;
	}
	return fields;
}

/** Which top-level PortfolioData keys each wizard step is responsible for. */
export const STEP_FIELDS: Record<WizardStepId, string[]> = {
	basics: ["profile", "socials"],
	experience: ["experience"],
	projects: ["projects"],
	skills: ["skills"],
	review: [],
};

/**
 * Validates the whole PortfolioData object but returns only the field
 * errors that belong to `stepId` — so hitting "Next" on the Basics step
 * doesn't block on an incomplete Experience entry the user hasn't gotten
 * to yet.
 */
export function validateStep(data: PortfolioData, stepId: WizardStepId): FieldErrors {
	const all = flatten(data);
	const prefixes = STEP_FIELDS[stepId];
	if (prefixes.length === 0) return {};

	const scoped: FieldErrors = {};
	for (const [path, message] of Object.entries(all)) {
		const topKey = path.split(".")[0];
		if (prefixes.includes(topKey)) scoped[path] = message;
	}
	return scoped;
}

/** True if `data` fully validates against the shared schema — used before publish/export. */
export function isPortfolioDataValid(data: PortfolioData): boolean {
	return portfolioDataSchema.safeParse(data).success;
}
