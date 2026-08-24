import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
	ArrowUpRight,
	Boxes,
	Download,
	Globe,
	ImageUp,
	ListChecks,
	MonitorPlay,
	Palette,
	RefreshCw,
	Rocket,
	ShieldCheck,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { PORTFOLIO_DOMAIN } from "@/lib/env";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GridCanvas } from "@/components/animated/GridCanvas";
import { SplitText } from "@/components/animated/SplitText";
import { ScrollReveal, StaggerGrid } from "@/components/animated/ScrollReveal";
import { SpotlightCard } from "@/components/animated/SpotlightCard";
import { TiltCard } from "@/components/animated/TiltCard";
import { MagneticButton } from "@/components/animated/MagneticButton";
import { Counter } from "@/components/animated/Counter";
import { usePrefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/** The names that cycle through the address bar in the subdomain demo. */
const DEMO_SUBDOMAINS = ["darshan", "ada", "you", "grace"] as const;
const SUBDOMAIN_HOLD_MS = 2200;

/**
 * The one moment of showmanship on this page: a browser chrome frame whose
 * address bar retypes itself, so "your own name.<domain>" is shown rather
 * than only described. Reduced-motion users get a single static address —
 * the point survives without the typing.
 */
function SubdomainMarquee() {
	const reduced = usePrefersReducedMotion();
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (reduced) return;
		const id = setInterval(() => setIndex((i) => (i + 1) % DEMO_SUBDOMAINS.length), SUBDOMAIN_HOLD_MS);
		return () => clearInterval(id);
	}, [reduced]);

	const name = DEMO_SUBDOMAINS[index];

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
			<div className="flex items-center gap-1.5 border-b border-border bg-muted px-3 py-2.5">
				<span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
				<span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
				<span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
			</div>
			<div className="p-4 sm:p-5">
				<div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5">
					<Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
					<p className="truncate font-mono text-sm sm:text-base">
						<span className="text-muted-foreground">https://</span>
						{/*
						 * Keyed on the name so React remounts the span and the
						 * CSS type-in restarts on every change; the surrounding
						 * text stays put, so only the name appears to retype.
						 */}
						<span key={name} className={cn("font-semibold text-primary", !reduced && "about-type")}>
							{name}
						</span>
						<span className="text-foreground">.{PORTFOLIO_DOMAIN}</span>
						{!reduced && <span className="about-caret" aria-hidden />}
					</p>
				</div>
				<p className="mt-3 text-xs text-muted-foreground">
					One address, yours, on the open web — not a profile slug on someone else's platform.
				</p>
			</div>
		</div>
	);
}

interface Feature {
	icon: typeof Rocket;
	title: string;
	body: string;
}

const FEATURES: Feature[] = [
	{
		icon: MonitorPlay,
		title: "Live preview, not a mockup",
		body: "Every keystroke streams into an iframe running the real template — desktop, tablet, or phone width. Template code (and its global CSS) never touches the builder bundle.",
	},
	{
		icon: ListChecks,
		title: "A five-step wizard",
		body: "Basics → Experience → Projects → Skills → Review. Every field is validated against the same Zod schema the API enforces, so “valid here” and “valid on the server” can't drift apart.",
	},
	{
		icon: Rocket,
		title: "Publish in one click",
		body: `A real Vite build runs server-side, gets deployed behind atomic symlinks, and your.${PORTFOLIO_DOMAIN} is live. No dashboards to wire up, no DNS to babysit.`,
	},
	{
		icon: Download,
		title: "Or take the whole project",
		body: "Export a working Vite + React repo with your data baked in. bun install && bun run build, and it deploys to any static host. No proprietary format, no lock-in.",
	},
	{
		icon: Palette,
		title: "Rename, restyle, switch",
		body: "Change your subdomain, flip the published site between light and dark, or move to a different template entirely. Each change rebuilds and republishes for you.",
	},
	{
		icon: ShieldCheck,
		title: "Drafts that survive you",
		body: "The in-progress wizard persists locally, so you can pick a template logged out, sign in, and land back with everything intact. Two devices editing at once get a side-by-side chooser instead of a silent overwrite.",
	},
	{
		icon: ImageUp,
		title: "Photo and résumé uploads",
		body: "One control for both, checking type and size against the same rules the API applies before spending a byte on the network — with a real progress bar and a cancel button.",
	},
	{
		icon: RefreshCw,
		title: "Never a stale build",
		body: "Every build stamps an id the running app polls against, so a fix that shipped is a fix you actually see — the classic cached-index.html bug, closed.",
	},
];

const REASONS: { title: string; body: string }[] = [
	{
		title: "It's the shortest way to say who you are",
		body: "“I'm at darshannpatel.tech” fits in a conversation, a CV header, a talk slide, and an email signature. A platform URL with a numeric suffix does not.",
	},
	{
		title: "It reads as a professional, not a profile",
		body: "A hiring manager opening your own domain sees someone who ships and maintains things. It's a small signal that costs one afternoon and pays out on every application.",
	},
	{
		title: "No algorithm sits between you and a reader",
		body: "Nothing reorders your work, injects a feed, or buries a project below an ad. What you publish is what a visitor gets.",
	},
	{
		title: "The address outlives the host",
		body: "Platforms redesign, get acquired, or shut down. A domain you control can be re-pointed in minutes — export your project, host it anywhere, keep every link that ever pointed at you working.",
	},
	{
		title: "It grows with you",
		body: `Start on a free ${PORTFOLIO_DOMAIN} subdomain today; move to your own apex domain when you want one. The site is a plain static build either way.`,
	},
	{
		title: "One canonical link to keep updated",
		body: "New job, new project, new talk — you update one page, and every résumé, GitHub profile, and DM you've ever sent points at the current version of you.",
	},
];

const STEPS: { label: string; body: string }[] = [
	{ label: "Pick a template", body: "Five opinionated, genuinely animated designs — browse them running, not as screenshots." },
	{ label: "Fill in your details", body: "Work, projects, skills, links, photo, résumé. The preview keeps up with every keystroke." },
	{ label: "Review", body: "One page showing exactly what will be published, with anything incomplete called out." },
	{ label: "Publish or export", body: "Go live on a subdomain, or download the whole project and host it yourself." },
];

const STACK = [
	"React 19",
	"Vite 8 (Rolldown)",
	"React Compiler",
	"Tailwind v4",
	"GSAP + Motion",
	"Zod",
	"Zustand",
	"better-auth",
	"TipTap",
	"Bun",
];

interface AuthorLink {
	platform: string;
	handle: string;
	href: string;
	icon: "linkedin" | "github" | "globe";
}

const AUTHOR_LINKS: AuthorLink[] = [
	{
		platform: "LinkedIn",
		handle: "darshan-patel-2608",
		href: "https://www.linkedin.com/in/darshan-patel-2608",
		icon: "linkedin",
	},
	{ platform: "GitHub", handle: "darshan260802", href: "https://github.com/darshan260802", icon: "github" },
	{ platform: "Website", handle: "darshannpatel.tech", href: "https://darshannpatel.tech", icon: "globe" },
];

/**
 * lucide-react dropped its brand marks in v1, so GitHub and LinkedIn are
 * inlined here rather than pulled from the icon set.
 */
function BrandIcon({ name, className }: { name: "linkedin" | "github" | "globe"; className?: string }) {
	if (name === "globe") return <Globe className={className} aria-hidden />;

	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
			{name === "github" ? (
				<path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
			) : (
				<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
			)}
		</svg>
	);
}

export function AboutPage() {
	const { data: session } = useSession();

	return (
		<div>
			{/* Hero — same grid-canvas treatment as the gallery, so About reads as part of the app rather than a bolted-on marketing page. */}
			<div className="relative border-b border-border/70">
				<GridCanvas />
				<div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
					<span className="build-tag">About · Portfolio Builder</span>
					<SplitText
						as="h1"
						text="A portfolio, assembled from your data."
						className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl"
					/>
					<p className="mt-5 max-w-2xl text-lg text-muted-foreground">
						Pick a template, fill in your details, and get a hosted, animated portfolio at your own{" "}
						<span className="font-mono text-foreground">name.{PORTFOLIO_DOMAIN}</span> — or download the whole
						project and host it wherever you like. It takes an hour, and it still looks like you spent a weekend.
					</p>

					<div className="mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
						{[
							{ value: 5, suffix: "", label: "Templates" },
							{ value: 5, suffix: "", label: "Wizard steps" },
							{ value: 1, suffix: "", label: "Click to publish" },
							{ value: 0, suffix: "", label: "Lock-in" },
						].map((stat) => (
							<div key={stat.label}>
								<Counter
									value={stat.value}
									suffix={stat.suffix}
									className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
								/>
								<p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-6xl px-6">
				{/* What it is */}
				<section className="border-b border-border/70 py-16 sm:py-20">
					<ScrollReveal>
						<span className="build-tag">01 · What this is</span>
						<h2 className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
							A builder that outputs a real site, not a hosted profile
						</h2>
						<div className="mt-5 grid gap-6 text-muted-foreground sm:grid-cols-2">
							<p>
								Most portfolio tools hand you a page inside their product. This one runs an actual Vite + React
								build over your data and deploys the result — the same project you can download and keep. The
								templates are real animated sites rendered in an isolated iframe, so what you preview is what
								gets published, down to the easing curves.
							</p>
							<p>
								It's three pieces that stay deliberately separate: this builder UI, an API that handles auth,
								storage and the build/publish pipeline, and a templates package holding the designs and the
								shared schema both sides validate against. That split is why a new template can ship without
								touching the wizard, and why your data has exactly one definition.
							</p>
						</div>
					</ScrollReveal>
				</section>

				{/* Features */}
				<section className="border-b border-border/70 py-16 sm:py-20">
					<ScrollReveal>
						<span className="build-tag">02 · Features</span>
						<h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
							What's in the box
						</h2>
					</ScrollReveal>

					<StaggerGrid className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{FEATURES.map((feature) => (
							<TiltCard key={feature.title} max={4}>
								<Card className="h-full">
									<SpotlightCard className="h-full rounded-lg">
										<CardHeader>
											<span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
												<feature.icon className="h-4.5 w-4.5" aria-hidden />
											</span>
											<CardTitle className="mt-3 leading-snug">{feature.title}</CardTitle>
										</CardHeader>
										<CardContent className="pb-6 text-sm text-muted-foreground">{feature.body}</CardContent>
									</SpotlightCard>
								</Card>
							</TiltCard>
						))}
					</StaggerGrid>
				</section>

				{/* Why your own domain */}
				<section className="border-b border-border/70 py-16 sm:py-20">
					<div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
						<ScrollReveal>
							<div className="lg:sticky lg:top-24">
								<span className="build-tag">03 · Why a domain of your own</span>
								<h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
									<span className="font-mono text-primary">name</span>.{PORTFOLIO_DOMAIN} beats a profile
									URL — every time
								</h2>
								<p className="mt-5 text-muted-foreground">
									A personal address is the cheapest piece of professional infrastructure you will ever own.
									It's a name people can remember, a place nobody else controls, and a link that keeps working
									long after whichever platform you'd otherwise have used has redesigned itself.
								</p>
								<div className="mt-8">
									<SubdomainMarquee />
								</div>
							</div>
						</ScrollReveal>

						<StaggerGrid className="grid gap-5">
							{REASONS.map((reason) => (
								<div key={reason.title} className="border-l-2 border-border pl-5 transition-colors hover:border-primary">
									<h3 className="font-display text-base font-semibold">{reason.title}</h3>
									<p className="mt-1.5 text-sm text-muted-foreground">{reason.body}</p>
								</div>
							))}
						</StaggerGrid>
					</div>
				</section>

				{/* How it works */}
				<section className="border-b border-border/70 py-16 sm:py-20">
					<ScrollReveal>
						<span className="build-tag">04 · How it works</span>
						<h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
							Four moves, start to live
						</h2>
					</ScrollReveal>

					<StaggerGrid className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{STEPS.map((step, i) => (
							<div key={step.label} className="relative rounded-lg border border-border bg-card p-6 shadow-sm">
								<span className="font-mono text-xs font-medium text-primary">
									{String(i + 1).padStart(2, "0")}
								</span>
								<h3 className="mt-2 font-display text-base font-semibold">{step.label}</h3>
								<p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
							</div>
						))}
					</StaggerGrid>
				</section>

				{/* Under the hood */}
				<section className="border-b border-border/70 py-16 sm:py-20">
					<ScrollReveal>
						<span className="build-tag">05 · Under the hood</span>
						<h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
							Built on current, boring-on-purpose tools
						</h2>
						<p className="mt-5 max-w-2xl text-muted-foreground">
							Nothing exotic, nothing abandoned — a stack chosen so the exported project still builds years from
							now with a single install command.
						</p>
						<div className="mt-7 flex flex-wrap gap-2">
							{STACK.map((item) => (
								<span
									key={item}
									className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground"
								>
									{item}
								</span>
							))}
						</div>
						<div className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-5">
							<Boxes className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
							<p className="text-sm text-muted-foreground">
								<span className="font-medium text-foreground">One project, three repositories.</span> The builder
								UI you're using now, the API behind auth and publishing, and the templates package that both the
								preview and the published site render from.
							</p>
						</div>
					</ScrollReveal>
				</section>

				{/* Author */}
				<section className="border-b border-border/70 py-16 sm:py-20">
					<ScrollReveal>
						<span className="build-tag">06 · Who made it</span>
						<Card className="mt-6 overflow-hidden">
							<SpotlightCard className="rounded-lg">
								<div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
									<div
										aria-hidden
										className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary font-display text-2xl font-semibold text-primary-foreground shadow-md"
									>
										DP
									</div>

									<div>
										<h2 className="font-display text-2xl font-semibold tracking-tight">Darshan Patel</h2>
										<p className="mt-1 text-sm text-muted-foreground">
											Developer · builder of this app, its API, and its templates
										</p>
										<p className="mt-5 max-w-2xl text-muted-foreground">
											I built Portfolio Builder because helping friends put a portfolio online kept turning
											into the same weekend: pick a design, fight a framework, give up on the animations, and
											still end up with a link nobody remembers. So the whole path — the designs, the schema,
											the build pipeline, the hosting — is one project, and the output belongs to whoever
											filled in the form. If you use it and something annoys you, the issues tab is open.
										</p>

										{/*
										 * Rows rather than inline pills: the handles are long
										 * enough that pills wrap mid-URL on a phone. Stacked
										 * full-width on mobile, three across from sm up.
										 */}
										<div className="mt-7 grid gap-3 sm:grid-cols-3">
											{AUTHOR_LINKS.map((link) => (
												<a
													key={link.href}
													href={link.href}
													target="_blank"
													rel="noreferrer noopener"
													className="group flex items-center gap-3 rounded-md border border-border px-4 py-3 transition-colors hover:border-primary"
												>
													<BrandIcon
														name={link.icon}
														className="h-4.5 w-4.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
													/>
													<span className="min-w-0">
														<span className="block text-sm font-medium">{link.platform}</span>
														<span className="block truncate font-mono text-xs text-muted-foreground">
															{link.handle}
														</span>
													</span>
													<ArrowUpRight
														className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
														aria-hidden
													/>
												</a>
											))}
										</div>
									</div>
								</div>
							</SpotlightCard>
						</Card>
					</ScrollReveal>
				</section>

				{/* CTA */}
				<section className="py-20 sm:py-24">
					<ScrollReveal className="text-center">
						<h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
							Your turn to claim a name
						</h2>
						<p className="mx-auto mt-4 max-w-xl text-muted-foreground">
							Browse the templates first — they run live, no signup needed to look around.
						</p>
						<div className="mt-9 flex flex-wrap items-center justify-center gap-3">
							<MagneticButton>
								<Link to="/" className={cn(buttonVariants({ size: "lg" }))}>
									Browse templates
								</Link>
							</MagneticButton>
							<Link
								to={session ? "/dashboard" : "/signup"}
								className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
							>
								{session ? "Go to dashboard" : "Create an account"}
							</Link>
						</div>
					</ScrollReveal>
				</section>
			</div>
		</div>
	);
}
