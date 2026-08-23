import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	ariaInvalid?: boolean;
	id?: string;
}

/**
 * A deliberately small formatting set — bold, italic, links, lists — for
 * bio/summary/description fields. No image support by design: this content
 * is stored as an HTML string and rendered into a template's own styled
 * page via a fixed, sanitized tag allowlist (see the API's rich-text
 * sanitizer and each template's .rich-text CSS); an editor-inserted image
 * would need its own upload/storage flow this feature doesn't have.
 */
export function RichTextEditor({ value, onChange, placeholder, ariaInvalid, id }: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: false,
				blockquote: false,
				codeBlock: false,
				horizontalRule: false,
				code: false,
			}),
			Link.configure({
				openOnClick: false,
				autolink: true,
				HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
			}),
			Placeholder.configure({ placeholder }),
		],
		content: value,
		editorProps: {
			attributes: {
				id: id ?? "",
				class: "rich-text-editor__content",
				"aria-invalid": ariaInvalid ? "true" : "false",
			},
		},
		onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
	});

	if (!editor) return null;

	return (
		<div
			className={cn(
				"rounded-md border border-border bg-card transition-colors",
				"focus-within:ring-2 focus-within:ring-ring",
				ariaInvalid && "border-destructive focus-within:ring-destructive/40",
			)}
		>
			<div className="flex flex-wrap items-center gap-1 border-b border-border p-1.5">
				<ToolbarButton
					label="Bold"
					active={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<Bold className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="Italic"
					active={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<Italic className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="Bullet list"
					active={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<List className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="Numbered list"
					active={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<ListOrdered className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="Link"
					active={editor.isActive("link")}
					onClick={() => {
						const previous = editor.getAttributes("link").href as string | undefined;
						const url = window.prompt("Link URL", previous ?? "https://");
						if (url === null) return;
						if (url.trim() === "") {
							editor.chain().focus().extendMarkRange("link").unsetLink().run();
							return;
						}
						editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
					}}
				>
					<LinkIcon className="h-4 w-4" />
				</ToolbarButton>
				<div className="mx-1 h-5 w-px bg-border" />
				<ToolbarButton
					label="Undo"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
				>
					<Undo2 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="Redo"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
				>
					<Redo2 className="h-4 w-4" />
				</ToolbarButton>
			</div>
			<EditorContent editor={editor} className="text-sm" />
		</div>
	);
}

interface ToolbarButtonProps {
	label: string;
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: React.ReactNode;
}

function ToolbarButton({ label, active, disabled, onClick, children }: ToolbarButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={active}
			disabled={disabled}
			onClick={onClick}
			className={cn(
				"flex h-7 w-7 items-center justify-center rounded transition-colors disabled:pointer-events-none disabled:opacity-40",
				active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}
