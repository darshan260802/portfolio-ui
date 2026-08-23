import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<textarea
			className={cn(
				"flex min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
				"aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/40",
				className,
			)}
			{...props}
		/>
	);
}
