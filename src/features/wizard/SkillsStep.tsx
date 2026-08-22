import { useState, type KeyboardEvent } from "react";
import type { PortfolioData, Skill } from "@pb/templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface StepProps {
	data: PortfolioData;
	onChange: (updater: (data: PortfolioData) => PortfolioData) => void;
}

export function SkillsStep({ data, onChange }: StepProps) {
	const skills = data.skills ?? [];
	const [draft, setDraft] = useState("");

	function addSkill(name: string) {
		const trimmed = name.trim();
		if (!trimmed) return;
		const skill: Skill = { id: crypto.randomUUID(), name: trimmed };
		onChange((d) => ({ ...d, skills: [...(d.skills ?? []), skill] }));
		setDraft("");
	}

	function removeSkill(id: string) {
		onChange((d) => ({ ...d, skills: (d.skills ?? []).filter((s) => s.id !== id) }));
	}

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addSkill(draft);
		}
	}

	return (
		<div className="flex flex-col gap-3">
			<Label htmlFor="skill-input">Skills</Label>
			<Input
				id="skill-input"
				placeholder="Type a skill and press Enter"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={handleKeyDown}
			/>
			<div className="flex flex-wrap gap-2">
				{skills.map((skill) => (
					<span
						key={skill.id}
						className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm"
					>
						{skill.name}
						<button
							type="button"
							onClick={() => removeSkill(skill.id)}
							aria-label={`Remove ${skill.name}`}
							className="text-muted-foreground hover:text-foreground"
						>
							<X className="h-3 w-3" />
						</button>
					</span>
				))}
			</div>
		</div>
	);
}
