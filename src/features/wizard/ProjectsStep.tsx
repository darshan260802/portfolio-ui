import type { PortfolioData, Project } from "@pb/templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function emptyProject(): Project {
	return { id: crypto.randomUUID(), title: "" };
}

export function ProjectsStep({ data, onChange, errors = {} }: StepProps) {
	const projects = data.projects ?? [];

	function add() {
		onChange((d) => ({ ...d, projects: [...(d.projects ?? []), emptyProject()] }));
	}
	function update(id: string, patch: Partial<Project>) {
		onChange((d) => ({
			...d,
			projects: (d.projects ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
		}));
	}
	function remove(id: string) {
		onChange((d) => ({ ...d, projects: (d.projects ?? []).filter((p) => p.id !== id) }));
	}

	return (
		<div className="flex flex-col gap-4">
			{projects.map((item, i) => (
				<Card key={item.id}>
					<CardContent className="flex flex-col gap-3 pt-6">
						<div className="flex flex-col gap-1.5">
							<Label>Title</Label>
							<Input
								value={item.title}
								onChange={(e) => update(item.id, { title: e.target.value })}
								aria-invalid={Boolean(errors[`projects.${i}.title`])}
							/>
							<FieldError message={errors[`projects.${i}.title`]} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Description</Label>
							<Textarea
								value={item.description ?? ""}
								onChange={(e) => update(item.id, { description: e.target.value })}
								aria-invalid={Boolean(errors[`projects.${i}.description`])}
							/>
							<FieldError message={errors[`projects.${i}.description`]} />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1.5">
								<Label>Live URL</Label>
								<Input
									placeholder="https://…"
									value={item.liveUrl ?? ""}
									onChange={(e) => update(item.id, { liveUrl: e.target.value })}
									aria-invalid={Boolean(errors[`projects.${i}.liveUrl`])}
								/>
								<FieldError message={errors[`projects.${i}.liveUrl`]} />
							</div>
							<div className="flex flex-col gap-1.5">
								<Label>Source URL</Label>
								<Input
									placeholder="https://github.com/…"
									value={item.repoUrl ?? ""}
									onChange={(e) => update(item.id, { repoUrl: e.target.value })}
									aria-invalid={Boolean(errors[`projects.${i}.repoUrl`])}
								/>
								<FieldError message={errors[`projects.${i}.repoUrl`]} />
							</div>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Tags (comma separated)</Label>
							<Input
								value={(item.tags ?? []).join(", ")}
								onChange={(e) =>
									update(item.id, {
										tags: e.target.value
											.split(",")
											.map((t) => t.trim())
											.filter(Boolean),
									})
								}
							/>
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
				<Plus className="h-4 w-4" /> Add project
			</Button>
		</div>
	);
}
