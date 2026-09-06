import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";

/**
 * The environment-variable rows on the import form.
 *
 * One rule shapes the whole component: **the API never sends a stored value
 * back.** So a variable that already exists renders with an empty value box
 * and a "leave blank to keep it" placeholder, and only counts as changed
 * once someone actually types in it (`touched`). That's what lets a person
 * rename a build command, or delete one unrelated variable, without having
 * to dig every API key back out of wherever they keep them.
 *
 * Values are masked by default for the obvious shoulder-surfing reason, with
 * a per-row reveal — these are mostly secrets, but a few (a public analytics
 * id, a base URL) aren't, and typing a long token blind is miserable.
 */

export interface EnvRow {
	id: string;
	key: string;
	value: string;
	/** This key already exists server-side. */
	saved: boolean;
	/** The value box has been edited in this session. */
	touched: boolean;
	/** Reveal the value box for this row. */
	visible: boolean;
}

export function newEnvRow(): EnvRow {
	return { id: crypto.randomUUID(), key: "", value: "", saved: false, touched: false, visible: true };
}

export function envRowsFromKeys(keys: string[]): EnvRow[] {
	return keys.map((key) => ({
		id: crypto.randomUUID(),
		key,
		value: "",
		saved: true,
		touched: false,
		visible: false,
	}));
}

/**
 * Turns the rows into what the API expects: every row that still has a name,
 * with `value` omitted for a saved row nobody touched. Rows removed from the
 * list are simply absent, which is how the API reads "delete this one".
 */
export function envRowsToPayload(rows: EnvRow[]): { key: string; value?: string }[] {
	return rows
		.filter((row) => row.key.trim().length > 0)
		.map((row) =>
			row.saved && !row.touched ? { key: row.key.trim() } : { key: row.key.trim(), value: row.value },
		);
}

interface EnvVarsEditorProps {
	rows: EnvRow[];
	onChange: (rows: EnvRow[]) => void;
	disabled?: boolean;
	/** Field errors from the API, keyed as `env.0.key` / `env.0.value`. */
	fieldErrors?: Record<string, string>;
}

export function EnvVarsEditor({ rows, onChange, disabled, fieldErrors }: EnvVarsEditorProps) {
	function update(id: string, patch: Partial<EnvRow>) {
		onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
	}

	return (
		<div className="flex flex-col gap-3">
			{rows.length === 0 && (
				<p className="text-sm text-muted-foreground">
					No environment variables. Add one if your build needs an API key or a public base URL.
				</p>
			)}

			{rows.map((row, index) => {
				const keyError = fieldErrors?.[`env.${index}.key`];
				const valueError = fieldErrors?.[`env.${index}.value`];

				return (
					<div key={row.id} className="flex flex-col gap-1.5">
						<div className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
							<div className="min-w-0 flex-1 basis-full sm:basis-2/5">
								<Label htmlFor={`env-key-${row.id}`} className="sr-only">
									Variable name
								</Label>
								<Input
									id={`env-key-${row.id}`}
									value={row.key}
									onChange={(e) => update(row.id, { key: e.target.value })}
									placeholder="MY_API_KEY"
									spellCheck={false}
									autoCapitalize="off"
									autoCorrect="off"
									aria-invalid={Boolean(keyError)}
									disabled={disabled}
									className="font-mono text-xs"
								/>
							</div>

							<div className="relative min-w-0 flex-1">
								<Label htmlFor={`env-value-${row.id}`} className="sr-only">
									Value
								</Label>
								<Input
									id={`env-value-${row.id}`}
									type={row.visible ? "text" : "password"}
									value={row.value}
									onChange={(e) => update(row.id, { value: e.target.value, touched: true })}
									placeholder={row.saved && !row.touched ? "Saved — leave blank to keep" : "value"}
									spellCheck={false}
									autoCapitalize="off"
									autoCorrect="off"
									autoComplete="off"
									aria-invalid={Boolean(valueError)}
									disabled={disabled}
									className="pr-10 font-mono text-xs"
								/>
								<button
									type="button"
									onClick={() => update(row.id, { visible: !row.visible })}
									aria-label={row.visible ? "Hide value" : "Show value"}
									className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
								>
									{row.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>

							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
								disabled={disabled}
								aria-label={`Remove ${row.key || "variable"}`}
								className="shrink-0 text-muted-foreground hover:text-destructive"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
						<FieldError message={keyError ?? valueError} />
					</div>
				);
			})}

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => onChange([...rows, newEnvRow()])}
				disabled={disabled}
				className="w-fit"
			>
				<Plus className="h-3.5 w-3.5" />
				Add variable
			</Button>
		</div>
	);
}
