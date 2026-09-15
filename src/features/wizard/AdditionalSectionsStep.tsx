import type { PortfolioData, Education, Achievement, CustomSection } from "@pb/templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { LinksEditor } from "./LinksEditor";
import type { FieldErrors } from "./validation";

type Kind = "education" | "achievements" | "customSections";
type Entry = Education | Achievement | CustomSection;
const TITLES = { education: "Education", achievements: "Achievements", customSections: "Custom sections" };
const LIMITS = { education: 10, achievements: 30, customSections: 20 };

export function AdditionalSectionsStep({ kind, data, onChange, errors = {} }: {
  kind: Kind; data: PortfolioData; onChange: (updater: (data: PortfolioData) => PortfolioData) => void; errors?: FieldErrors;
}) {
  const entries: Entry[] = data[kind] ?? [];
  function setEntries(next: Entry[]) {
    onChange((prev) => kind === "education" ? { ...prev, education: next as Education[] }
      : kind === "achievements" ? { ...prev, achievements: next as Achievement[] }
      : { ...prev, customSections: next as CustomSection[] });
  }
  function update(index: number, patch: Partial<Entry>) {
    setEntries(entries.map((entry, i) => i === index ? { ...entry, ...patch } as Entry : entry));
  }
  function move(index: number, offset: number) {
    const next = [...entries];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setEntries(next);
  }
  function add() {
    const id = crypto.randomUUID();
    setEntries([...entries, kind === "education" ? { id, institution: "" } : { id, title: "" }]);
  }
  return <div className="flex flex-col gap-5">
    <div><h2 className="text-xl font-semibold">{TITLES[kind]}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{kind === "customSections" ? "Add your own sections for volunteering, publications, interests, or anything else. Their order here is their order on your portfolio." : "Add what you want to share. Empty sections stay hidden on your portfolio."}</p></div>
    {entries.map((entry, index) => {
      const prefix = `${kind}.${index}`;
      const education = kind === "education" ? entry as Education : null;
      const achievement = kind === "achievements" ? entry as Achievement : null;
      const custom = kind === "customSections" ? entry as CustomSection : null;
      const fields: [string, string, string | undefined][] = education
        ? [["institution", "Institution", education.institution], ["degree", "Degree", education.degree], ["fieldOfStudy", "Field of study", education.fieldOfStudy]]
        : achievement ? [["title", "Achievement", achievement.title], ["issuer", "Awarded by", achievement.issuer]]
        : [["title", "Section title", custom?.title]];
      return <fieldset key={entry.id} className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <legend className="px-1 text-sm font-medium">{TITLES[kind]} {index + 1}</legend>
        {fields.map(([key, label, value]) => <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`${entry.id}-${key}`}>{label}</Label>
          <Input id={`${entry.id}-${key}`} value={value ?? ""} maxLength={160} onChange={(e) => update(index, { [key]: e.target.value })} aria-invalid={!!errors[`${prefix}.${key}`]} />
          <FieldError message={errors[`${prefix}.${key}`]} />
        </div>)}
        {education && <fieldset className="flex flex-col gap-3"><legend className="mb-2 text-sm">Dates (optional)</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["start", "end"] as const).map((key) => <div key={key}>
              <Label htmlFor={`${entry.id}-${key}`}>{key === "start" ? "Start date" : "End date"}</Label>
              <Input id={`${entry.id}-${key}`} type="month" disabled={key === "end" && education.range?.current} value={education.range?.[key] ?? ""}
                onChange={(e) => { const range = { start: "", ...education.range, [key]: e.target.value }; update(index, { range: !range.start && !range.end && !range.current ? undefined : range }); }} />
              <FieldError message={errors[`${prefix}.range.${key}`]} />
            </div>)}
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={education.range?.current ?? false} onChange={(e) => update(index, { range: { start: "", ...education.range, current: e.target.checked, end: e.target.checked ? undefined : education.range?.end } })} />Currently studying</label>
        </fieldset>}
        {achievement && <div><Label htmlFor={`${entry.id}-date`}>Date (optional)</Label><Input id={`${entry.id}-date`} type="month" value={achievement.date ?? ""} onChange={(e) => update(index, { date: e.target.value })} /><FieldError message={errors[`${prefix}.date`]} /></div>}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${entry.id}-content`}>{custom ? "Section content" : "Description"}</Label>
          <RichTextEditor id={`${entry.id}-content`} value={education?.summary ?? achievement?.description ?? custom?.content ?? ""}
            onChange={(html) => update(index, education ? { summary: html } : achievement ? { description: html } : { content: html })} />
          <FieldError message={errors[`${prefix}.${education ? "summary" : achievement ? "description" : "content"}`]} />
        </div>
        {!education && <LinksEditor links={achievement?.links ?? custom?.links ?? []} onChange={(links) => update(index, { links })} prefix={`${prefix}.links`} errors={errors} />}
        {custom && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={custom.visible !== false} onChange={(e) => update(index, { visible: e.target.checked })} />Show this section on my portfolio</label>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => move(index, -1)}>Move up</Button>
          <Button type="button" size="sm" variant="outline" disabled={index === entries.length - 1} onClick={() => move(index, 1)}>Move down</Button>
          <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => setEntries(entries.filter((_, i) => i !== index))}>Remove</Button>
        </div>
      </fieldset>;
    })}
    <FieldError message={errors[kind]} />
    <Button type="button" variant="outline" className="w-fit" disabled={entries.length >= LIMITS[kind]} onClick={add}>Add {kind === "education" ? "education" : kind === "achievements" ? "achievement" : "section"}</Button>
  </div>;
}
