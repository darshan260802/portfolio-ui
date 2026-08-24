import type { PortfolioData, Social, UploadKind } from "@pb/templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { UploadField, type UploadedFile } from "@/components/ui/upload-field";
import { api } from "@/lib/api";
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
	/**
	 * Saves the given data immediately, resolving to whether it stuck.
	 * Removing an upload needs this: the file is only deleted from storage
	 * once the profile that pointed at it has been saved without it, so a
	 * half-finished removal can't leave a published portfolio linking to a
	 * file that no longer exists.
	 */
	onSave?: (data: PortfolioData) => Promise<boolean>;
}

export function BasicsStep({ data, onChange, errors = {}, onSave }: StepProps) {
	const socials = data.socials ?? [];

	function updateProfile<K extends keyof PortfolioData["profile"]>(key: K, value: PortfolioData["profile"][K]) {
		onChange((d) => ({ ...d, profile: { ...d.profile, [key]: value } }));
	}

	function applyUpload(kind: UploadKind, file: UploadedFile) {
		onChange((d) => ({
			...d,
			profile:
				kind === "avatar"
					? { ...d.profile, avatarUrl: file.url }
					: { ...d.profile, resumeUrl: file.url, resumeFilename: file.filename },
		}));
	}

	async function removeUpload(kind: UploadKind) {
		const next: PortfolioData = {
			...data,
			profile:
				kind === "avatar"
					? { ...data.profile, avatarUrl: undefined }
					: { ...data.profile, resumeUrl: undefined, resumeFilename: undefined },
		};
		onChange(() => next);

		// Only once the cleared profile is safely saved is the stored file
		// actually garbage. Without a save this step is local-only until the
		// user hits Next, and deleting first would strand the saved profile on
		// a URL that 404s. If there's no save available, the field is cleared
		// and the object gets collected by the next upload of this kind.
		if (!onSave || !(await onSave(next))) return;
		// Best-effort: a leftover object costs a few KB, and the user has
		// already seen the field clear.
		await api.delete(`/api/uploads/${kind}`).catch(() => undefined);
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
				<RichTextEditor
					id="bio"
					value={data.profile.bio ?? ""}
					onChange={(html) => updateProfile("bio", html)}
					placeholder="A couple sentences about what you do and what you're into."
					ariaInvalid={Boolean(errors["profile.bio"])}
				/>
				<FieldError message={errors["profile.bio"]} />
			</div>
			{/* One column on phones: three side-by-side inputs at 375px wide
			    left no room for either the label or the value. */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="phone">Phone</Label>
					{/* type="tel" is what gets phones to show the dial pad
					    keyboard; autoComplete lets the browser fill it. */}
					<Input
						id="phone"
						type="tel"
						inputMode="tel"
						autoComplete="tel"
						placeholder="+1 555 123 4567"
						value={data.profile.phone ?? ""}
						onChange={(e) => updateProfile("phone", e.target.value)}
						aria-invalid={Boolean(errors["profile.phone"])}
					/>
					<FieldError message={errors["profile.phone"]} />
				</div>
			</div>

			<UploadField
				kind="avatar"
				label="Profile photo"
				description="Shown on your published portfolio — anyone who visits your site can see and download it."
				url={data.profile.avatarUrl}
				imagePreview
				onUploaded={(file) => applyUpload("avatar", file)}
				onRemove={() => removeUpload("avatar")}
				error={errors["profile.avatarUrl"]}
			/>

			<UploadField
				kind="resume"
				label="Résumé"
				description="Visitors get a download button on your published portfolio. Leave it empty and no button appears."
				url={data.profile.resumeUrl}
				filename={data.profile.resumeFilename}
				onUploaded={(file) => applyUpload("resume", file)}
				onRemove={() => removeUpload("resume")}
				error={errors["profile.resumeUrl"] ?? errors["profile.resumeFilename"]}
			/>

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
