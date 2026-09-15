export const WIZARD_STEPS = [
	{ id: "basics", label: "Basics" },
	{ id: "experience", label: "Experience" },
	{ id: "projects", label: "Projects" },
	{ id: "skills", label: "Skills" },
	{ id: "education", label: "Education" },
	{ id: "achievements", label: "Achievements" },
	{ id: "customSections", label: "Custom sections" },
	{ id: "review", label: "Review & Publish" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];
