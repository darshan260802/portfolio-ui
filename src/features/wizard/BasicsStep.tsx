import type { PortfolioData, Social } from "@pb/templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { X } from "lucide-react";
import type { FieldErrors } from "./validation";
import { cn } from "@/lib/utils";

// "system" is a valid schema value, but no template actually branches on it
// differently from unset/light (each template's Template.tsx checks for
// exactly theme.mode === "dark", nothing else) — offering it here would be
// a toggle that does nothing distinct, so this only exposes the two modes
// templates genuinely render differently.
const THEME_MODES = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;

const SOCIAL_PLATFORMS: Social["platform"][] = [
	"github",
	"linkedin",
	"twitter",
	"bluesky",
	"dribbble",
	"behance",
	"youtube",
	"website",
	"other",
];

interface StepProps {
	data: PortfolioData;
	onChange: (updater: (data: PortfolioData) => PortfolioData) => void;
	errors?: FieldErrors;
}

export function BasicsStep({ data, onChange, errors = {} }: StepProps) {
	const socials = data.socials ?? [];

	function updateProfile<K extends keyof PortfolioData["profile"]>(key: K, value: PortfolioData["profile"][K]) {
		onChange((d) => ({ ...d, profile: { ...d.profile, [key]: value } }));
	}

	function addSocial() {
		onChange((d) => ({
			...d,
			socials: [...(d.socials ?? []), { platform: "website", url: "" }],
		}));
	}

	function updateSocial(index: number, patch: Partial<Social>) {
		onChange((d) => ({
			...d,
			socials: (d.socials ?? []).map((s, i) => (i === index ? { ...s, ...patch } : s)),
		}));
	}

	function removeSocial(index: number) {
		onChange((d) => ({ ...d, socials: (d.socials ?? []).filter((_, i) => i !== index) }));
	}

	function setThemeMode(mode: "light" | "dark") {
		onChange((d) => ({ ...d, theme: { ...d.theme, mode } }));
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="fullName">Full name</Label>
				<Input
					id="fullName"
					value={data.profile.fullName}
					onChange={(e) => updateProfile("fullName", e.target.value)}
					aria-invalid={Boolean(errors["profile.fullName"])}
					required
				/>
				<FieldError message={errors["profile.fullName"]} />
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="headline">Headline</Label>
				<Input
					id="headline"
					placeholder="Senior Frontend Engineer"
					value={data.profile.headline ?? ""}
					onChange={(e) => updateProfile("headline", e.target.value)}
					aria-invalid={Boolean(errors["profile.headline"])}
				/>
				<FieldError message={errors["profile.headline"]} />
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="bio">Bio</Label>
				<Textarea
					id="bio"
					value={data.profile.bio ?? ""}
					onChange={(e) => updateProfile("bio", e.target.value)}
					aria-invalid={Boolean(errors["profile.bio"])}
				/>
				<FieldError message={errors["profile.bio"]} />
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="location">Location</Label>
					<Input
						id="location"
						value={data.profile.location ?? ""}
						onChange={(e) => updateProfile("location", e.target.value)}
						aria-invalid={Boolean(errors["profile.location"])}
					/>
					<FieldError message={errors["profile.location"]} />
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="email">Contact email</Label>
					<Input
						id="email"
						type="email"
						value={data.profile.email ?? ""}
						onChange={(e) => updateProfile("email", e.target.value)}
						aria-invalid={Boolean(errors["profile.email"])}
					/>
					<FieldError message={errors["profile.email"]} />
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<Label>Social links</Label>
					<Button type="button" variant="outline" size="sm" onClick={addSocial}>
						Add link
					</Button>
				</div>
				{socials.map((social, i) => (
					<div key={i} className="flex flex-col gap-1">
						<div className="flex gap-2">
							<select
								className="h-10 rounded-md border border-border bg-card px-2 text-sm capitalize"
								value={social.platform}
								onChange={(e) => updateSocial(i, { platform: e.target.value as Social["platform"] })}
							>
								{SOCIAL_PLATFORMS.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</select>
							<Input
								placeholder="https://…"
								value={social.url}
								onChange={(e) => updateSocial(i, { url: e.target.value })}
								aria-invalid={Boolean(errors[`socials.${i}.url`])}
							/>
							<Button type="button" variant="ghost" size="icon" onClick={() => removeSocial(i)}>
								<X className="h-4 w-4" />
							</Button>
						</div>
						<FieldError message={errors[`socials.${i}.url`]} />
					</div>
				))}
			</div>

			<div className="flex flex-col gap-1.5">
				<Label>Appearance</Label>
				<p className="text-xs text-muted-foreground">
					Some templates look different in light vs. dark — pick which one yours publishes in.
				</p>
				<div className="flex w-fit gap-1 rounded-md border border-border bg-card p-1">
					{THEME_MODES.map((mode) => {
						const active = (data.theme?.mode ?? "light") === mode.value;
						return (
							<button
								key={mode.value}
								type="button"
								onClick={() => setThemeMode(mode.value)}
								aria-pressed={active}
								className={cn(
									"rounded px-3 py-1.5 text-sm transition-colors",
									active
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{mode.label}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
