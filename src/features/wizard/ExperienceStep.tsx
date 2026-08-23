import type { Experience, PortfolioData } from "@pb/templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Trash2, Plus } from "lucide-react";
import type { FieldErrors } from "./validation";

interface StepProps {
	data: PortfolioData;
	onChange: (updater: (data: PortfolioData) => PortfolioData) => void;
	errors?: FieldErrors;
}

function emptyExperience(): Experience {
	return {
		id: crypto.randomUUID(),
		role: "",
		company: "",
		range: { start: "", current: true },
	};
}

export function ExperienceStep({ data, onChange, errors = {} }: StepProps) {
	const experience = data.experience ?? [];

	function add() {
		onChange((d) => ({ ...d, experience: [...(d.experience ?? []), emptyExperience()] }));
	}
	function update(id: string, patch: Partial<Experience>) {
		onChange((d) => ({
			...d,
			experience: (d.experience ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
		}));
	}
	function remove(id: string) {
		onChange((d) => ({ ...d, experience: (d.experience ?? []).filter((e) => e.id !== id) }));
	}

	return (
		<div className="flex flex-col gap-4">
			{experience.map((item, i) => (
				<Card key={item.id}>
					<CardContent className="flex flex-col gap-3 pt-6">
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<Label>Role</Label>
								<Input
									value={item.role}
									onChange={(e) => update(item.id, { role: e.target.value })}
									aria-invalid={Boolean(errors[`experience.${i}.role`])}
								/>
								<FieldError message={errors[`experience.${i}.role`]} />
							</div>
							<div className="flex flex-col gap-1.5">
								<Label>Company</Label>
								<Input
									value={item.company}
									onChange={(e) => update(item.id, { company: e.target.value })}
									aria-invalid={Boolean(errors[`experience.${i}.company`])}
								/>
								<FieldError message={errors[`experience.${i}.company`]} />
							</div>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div className="flex flex-col gap-1.5">
								<Label>Start (YYYY-MM)</Label>
								<Input
									placeholder="2022-01"
									value={item.range.start}
									onChange={(e) => update(item.id, { range: { ...item.range, start: e.target.value } })}
									aria-invalid={Boolean(errors[`experience.${i}.range.start`])}
								/>
								<FieldError message={errors[`experience.${i}.range.start`]} />
							</div>
							<div className="flex flex-col gap-1.5">
								<Label>End (YYYY-MM)</Label>
								<Input
									placeholder="2024-06"
									disabled={item.range.current}
									value={item.range.end ?? ""}
									onChange={(e) => update(item.id, { range: { ...item.range, end: e.target.value } })}
									aria-invalid={Boolean(errors[`experience.${i}.range.end`])}
								/>
								<FieldError message={errors[`experience.${i}.range.end`]} />
							</div>
							<label className="flex items-center gap-2 self-end pb-2 text-sm">
								<input
									type="checkbox"
									checked={item.range.current ?? false}
									onChange={(e) =>
										update(item.id, { range: { ...item.range, current: e.target.checked } })
									}
								/>
								Current role
							</label>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Summary</Label>
							<RichTextEditor
								value={item.summary ?? ""}
								onChange={(html) => update(item.id, { summary: html })}
								placeholder="What did you work on? What impact did it have?"
								ariaInvalid={Boolean(errors[`experience.${i}.summary`])}
							/>
							<FieldError message={errors[`experience.${i}.summary`]} />
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-fit text-destructive"
							onClick={() => remove(item.id)}
						>
							<Trash2 className="h-4 w-4" /> Remove
						</Button>
					</CardContent>
				</Card>
			))}
			<Button type="button" variant="outline" onClick={add} className="w-fit">
				<Plus className="h-4 w-4" /> Add experience
			</Button>
		</div>
	);
}
