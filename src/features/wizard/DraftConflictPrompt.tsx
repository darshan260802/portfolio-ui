import { Fragment } from "react";
import type { PortfolioData } from "@pb/templates";
import { Cloud, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** One side of a local-vs-account draft conflict. */
export interface DraftCandidate {
	templateId: string;
	data: PortfolioData;
	/** Epoch ms this version last changed, or null if unknown. */
	updatedAt: number | null;
}

interface DraftConflictPromptProps {
	local: DraftCandidate;
	server: DraftCandidate;
	onChoose: (choice: "local" | "server") => void;
}

/**
 * Rich text is stored as an HTML string; the comparison rows want plain
 * text. DOMParser is the safe way to strip tags — it parses into an inert
 * document that never runs scripts or fetches subresources, unlike
 * assigning to a live element's innerHTML.
 */
function htmlToText(html: string | undefined): string {
	if (!html) return "";
	return (new DOMParser().parseFromString(html, "text/html").body.textContent ?? "").trim();
}

function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function countLabel(items: unknown[] | undefined, singular: string, plural = `${singular}s`): string {
	const n = items?.length ?? 0;
	if (n === 0) return "None";
	return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * The fields shown side by side. Each returns a display string for one
 * version — rows whose two sides differ are highlighted, so the user can
 * see at a glance what they'd actually be giving up.
 */
const COMPARISON_ROWS: { label: string; get: (candidate: DraftCandidate) => string }[] = [
	{ label: "Template", get: (c) => c.templateId },
	{ label: "Full name", get: (c) => c.data.profile.fullName || "—" },
	{ label: "Headline", get: (c) => c.data.profile.headline || "—" },
	{ label: "Location", get: (c) => c.data.profile.location || "—" },
	{ label: "Phone", get: (c) => c.data.profile.phone || "—" },
	{ label: "Bio", get: (c) => truncate(htmlToText(c.data.profile.bio), 120) || "—" },
	{ label: "Experience", get: (c) => countLabel(c.data.experience, "entry", "entries") },
	{ label: "Projects", get: (c) => countLabel(c.data.projects, "project") },
	{ label: "Skills", get: (c) => countLabel(c.data.skills, "skill") },
	{ label: "Education", get: (c) => countLabel(c.data.education, "entry", "entries") },
	{ label: "Social links", get: (c) => countLabel(c.data.socials, "link") },
];

function formatWhen(updatedAt: number | null): string {
	if (updatedAt === null) return "at an unknown time";
	const seconds = Math.round((Date.now() - updatedAt) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
	return `on ${new Date(updatedAt).toLocaleDateString()}`;
}

/**
 * Shown when this device's local draft and the account's saved profile both
 * hold real, differing content — most often after editing while signed out
 * on one device when another device already saved something. Neither side
 * can be discarded silently, so both are laid out field by field and the
 * user picks.
 *
 * Two layouts, because the comparison genuinely doesn't fit one shape:
 *
 * - **`md` and up** — ONE three-column grid (label + both versions) rather
 *   than two separate cards: grid rows size to their tallest cell, so a bio
 *   that wraps to three lines on one side keeps both sides' rows aligned.
 *   Two independent cards would drift out of step exactly where the content
 *   differs most, which is the content this screen exists to compare.
 *
 * - **Below `md`** — that grid can't hold three columns at 375px, and the
 *   previous fallback (`min-w-2xl` inside `overflow-x-auto`) put BOTH
 *   choice buttons off the right edge of a phone screen: the user had to
 *   discover a sideways scroll to do the one thing this screen asks of
 *   them. Instead each version becomes its own card with its "keep this"
 *   button directly under its heading — reachable without scrolling past
 *   eleven comparison rows — and the rows below it are labelled in place,
 *   with the *other* version's value shown inline on any row that differs
 *   so the comparison survives the stacking.
 */
export function DraftConflictPrompt({ local, server, onChoose }: DraftConflictPromptProps) {
	const columns = [
		{
			key: "local" as const,
			title: "This device",
			icon: Laptop,
			status: `Edited ${formatWhen(local.updatedAt)} · never saved`,
			candidate: local,
			other: server,
			otherTitle: "your account",
			cta: "Keep this device's version",
			variant: "default" as const,
		},
		{
			key: "server" as const,
			title: "Your account",
			icon: Cloud,
			status: `Saved ${formatWhen(server.updatedAt)}`,
			candidate: server,
			other: local,
			otherTitle: "this device",
			cta: "Keep the saved version",
			variant: "outline" as const,
		},
	];

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
			<div className="mx-auto max-w-xl text-center">
				<h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
					Which version do you want to keep?
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					This device has changes that were never saved to your account, and your account already has a different
					saved portfolio. Compare them below and pick one — the other will be discarded.
				</p>
			</div>

			{/* Phones: one card per version, choice button first. */}
			<div className="mt-6 flex flex-col gap-4 md:hidden">
				{columns.map(({ key, title, icon: Icon, status, candidate, other, otherTitle, cta, variant }) => (
					<div key={key} className="rounded-lg border border-border bg-card shadow-sm">
						<div className="flex flex-col gap-3 border-b border-border p-4">
							<div>
								<div className="flex items-center gap-2">
									<Icon className="h-4 w-4 text-muted-foreground" />
									<h3 className="font-display text-base font-semibold">{title}</h3>
								</div>
								<p className="mt-1 text-xs text-muted-foreground">{status}</p>
							</div>
							<Button variant={variant} className="w-full" onClick={() => onChoose(key)}>
								{cta}
							</Button>
						</div>
						<dl className="divide-y divide-border/60">
							{COMPARISON_ROWS.map((row) => {
								const mine = row.get(candidate);
								const theirs = row.get(other);
								const differs = mine !== theirs;
								return (
									<div key={row.label} className={cn("px-4 py-3", differs && "bg-muted/40")}>
										<dt className="text-xs text-muted-foreground">{row.label}</dt>
										<dd
											className={cn(
												"mt-0.5 text-sm break-words",
												differs ? "font-medium text-foreground" : "text-muted-foreground",
											)}
										>
											{mine}
										</dd>
										{differs && (
											<dd className="mt-1 text-xs text-muted-foreground break-words">
												{otherTitle} has: {theirs}
											</dd>
										)}
									</div>
								);
							})}
						</dl>
					</div>
				))}
			</div>

			{/* Tablet and up: the aligned side-by-side grid. */}
			<div className="mt-8 hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
				<div className="grid grid-cols-[7.5rem_1fr_1fr]">
					{/* Header: an empty cell above the row labels, then one per version. */}
					<div className="border-b border-border" />
					{columns.map(({ key, title, icon: Icon, status }) => (
						<div key={key} className="border-b border-l border-border px-5 py-4">
							<div className="flex items-center gap-2">
								<Icon className="h-4 w-4 text-muted-foreground" />
								<h3 className="font-display text-base font-semibold">{title}</h3>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">{status}</p>
						</div>
					))}

					{COMPARISON_ROWS.map((row) => {
						const differs = row.get(local) !== row.get(server);
						return (
							<Fragment key={row.label}>
								<div
									className={cn(
										"border-b border-border/60 px-5 py-3 text-xs text-muted-foreground",
										differs && "bg-muted/40",
									)}
								>
									{row.label}
								</div>
								{columns.map(({ key, candidate }) => (
									<div
										key={key}
										className={cn(
											"border-b border-l border-border/60 px-5 py-3 text-sm break-words",
											differs ? "bg-muted/40 font-medium text-foreground" : "text-muted-foreground",
										)}
									>
										{row.get(candidate)}
									</div>
								))}
							</Fragment>
						);
					})}

					{/* Footer: the two choices, each under the version it keeps. */}
					<div />
					{columns.map(({ key, cta, variant }) => (
						<div key={key} className="border-l border-border p-4">
							<Button variant={variant} className="w-full" onClick={() => onChoose(key)}>
								{cta}
							</Button>
						</div>
					))}
				</div>
			</div>

			<p className="mt-3 text-center text-xs text-muted-foreground">
				Highlighted rows are where the two versions differ.
			</p>
		</div>
	);
}
