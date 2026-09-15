import type { PortfolioLink } from "@pb/templates";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import type { FieldErrors } from "./validation";

export function LinksEditor({ links, onChange, prefix, errors = {} }: {
  links: PortfolioLink[]; onChange: (links: PortfolioLink[]) => void; prefix: string; errors?: FieldErrors;
}) {
  return <fieldset className="flex min-w-0 flex-col gap-3">
    <legend className="mb-2 text-sm font-medium">Additional links</legend>
    {links.map((link, index) => <div key={link.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
      <Input aria-label={`Link ${index + 1} label`} placeholder="Label, e.g. Case study" maxLength={60} value={link.label}
        onChange={(e) => onChange(links.map((x, i) => i === index ? { ...x, label: e.target.value } : x))} aria-invalid={!!errors[`${prefix}.${index}.label`]} />
      <FieldError message={errors[`${prefix}.${index}.label`]} />
      <Input aria-label={`Link ${index + 1} URL`} type="url" placeholder="https://…" value={link.url}
        onChange={(e) => onChange(links.map((x, i) => i === index ? { ...x, url: e.target.value } : x))} aria-invalid={!!errors[`${prefix}.${index}.url`]} />
      <FieldError message={errors[`${prefix}.${index}.url`]} />
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange(links.filter((_, i) => i !== index))}>Remove link {index + 1}</Button>
    </div>)}
    <FieldError message={errors[prefix]} />
    <Button type="button" variant="outline" className="w-fit" disabled={links.length >= 10}
      onClick={() => onChange([...links, { id: crypto.randomUUID(), label: "", url: "" }])}>Add link</Button>
  </fieldset>;
}
