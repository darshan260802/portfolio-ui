import { useEffect, useRef, useState } from "react";
import { FileText, ImageOff, Loader2, Trash2, Upload as UploadIcon } from "lucide-react";
import {
	type UploadKind,
	UPLOAD_RULES,
	extensionOf,
	formatBytes,
	uploadAccept,
	uploadFormatForExtension,
	uploadFormatList,
} from "@pb/templates";
import { apiUpload, UploadAborted, type Upload } from "@/lib/api";
import { formatApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface UploadedFile {
	url: string;
	filename: string;
	size: number;
}

interface UploadFieldProps {
	kind: UploadKind;
	label: string;
	/** Says what the file is for. Both call sites use it to say it goes public. */
	description: string;
	/** The URL already on the profile, if any. */
	url?: string;
	/** The stored filename, when one is known. Absent for a URL saved by hand. */
	filename?: string;
	onUploaded: (file: UploadedFile) => void;
	/** Clears the field. Resolves once the profile has been saved without it. */
	onRemove: () => void | Promise<void>;
	/** Render the current file as an image thumbnail instead of a file chip. */
	imagePreview?: boolean;
	/** A validation message from the server for the field this control feeds. */
	error?: string;
}

/**
 * One file in, one URL out. Backs both the profile photo and the résumé.
 *
 * The type and size checks here come from `UPLOAD_RULES` — the same object
 * the API validates against — so a file this control accepts is one the
 * server will accept too. They are a courtesy, not a control: the check that
 * counts happens on the bytes, server-side, and this one only exists to fail
 * in a tenth of a second instead of after a 5 MB upload.
 */
export function UploadField({
	kind,
	label,
	description,
	url,
	filename,
	onUploaded,
	onRemove,
	imagePreview = false,
	error,
}: UploadFieldProps) {
	const rules = UPLOAD_RULES[kind];
	const inputRef = useRef<HTMLInputElement>(null);
	const uploadRef = useRef<Upload<UploadedFile> | null>(null);

	const [progress, setProgress] = useState<number | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);
	const [removing, setRemoving] = useState(false);

	// An upload still in flight when this unmounts would resolve into a
	// component that no longer exists, and hold the connection open for a file
	// nobody is waiting on.
	useEffect(() => () => uploadRef.current?.abort(), []);

	const uploading = progress !== null;
	const busy = uploading || removing;

	function reject(message: string) {
		setLocalError(message);
		setProgress(null);
	}

	async function handleFile(file: File) {
		setLocalError(null);

		const extension = extensionOf(file.name);
		if (!extension || !uploadFormatForExtension(rules, extension)) {
			reject(`Choose a ${uploadFormatList(rules)} file.`);
			return;
		}
		if (file.size > rules.maxBytes) {
			reject(
				`That file is ${formatBytes(file.size)} — the limit is ${formatBytes(rules.maxBytes)}.`,
			);
			return;
		}

		uploadRef.current?.abort();
		setProgress(0);

		const upload = apiUpload<UploadedFile>(`/api/uploads/${kind}`, file, setProgress);
		uploadRef.current = upload;

		try {
			const uploaded = await upload.done;
			setProgress(null);
			onUploaded(uploaded);
		} catch (err) {
			// A cancelled upload is something the user did on purpose — the only
			// wrong response to it is an error message.
			if (err instanceof UploadAborted) return;
			reject(formatApiError(err));
		} finally {
			if (uploadRef.current === upload) uploadRef.current = null;
		}
	}

	async function handleRemove() {
		setLocalError(null);
		setRemoving(true);
		try {
			await onRemove();
		} finally {
			setRemoving(false);
		}
	}

	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={`upload-${kind}`}>{label}</Label>
			<p className="text-xs text-muted-foreground">{description}</p>

			<input
				id={`upload-${kind}`}
				ref={inputRef}
				type="file"
				className="sr-only"
				accept={uploadAccept(rules)}
				disabled={busy}
				onChange={(e) => {
					const file = e.target.files?.[0];
					// Reset first: picking the same file twice in a row fires no
					// change event otherwise, so a retry after a failed upload
					// would silently do nothing.
					e.target.value = "";
					if (file) void handleFile(file);
				}}
			/>

			<div className="mt-1 flex flex-wrap items-center gap-3">
				{url && !uploading && (
					<CurrentFile url={url} filename={filename} imagePreview={imagePreview} label={label} />
				)}

				{uploading ? (
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
						<div
							className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-muted"
							role="progressbar"
							aria-label={`Uploading ${label.toLowerCase()}`}
							aria-valuenow={Math.round(progress * 100)}
							aria-valuemin={0}
							aria-valuemax={100}
						>
							<div
								className="h-full rounded-full bg-primary transition-[width] duration-150"
								style={{ width: `${Math.round(progress * 100)}%` }}
							/>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => uploadRef.current?.abort()}
						>
							Cancel
						</Button>
					</div>
				) : (
					<>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={busy}
							onClick={() => inputRef.current?.click()}
						>
							<UploadIcon className="h-3.5 w-3.5" />
							{url ? "Replace" : `Upload ${label.toLowerCase()}`}
						</Button>
						{url && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={busy}
								onClick={() => void handleRemove()}
							>
								{removing ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Trash2 className="h-3.5 w-3.5" />
								)}
								Remove
							</Button>
						)}
					</>
				)}
			</div>

			<p className="text-xs text-muted-foreground">
				{uploadFormatList(rules)}, up to {formatBytes(rules.maxBytes)}.
			</p>

			<FieldError message={localError ?? error} />
		</div>
	);
}

function CurrentFile({
	url,
	filename,
	imagePreview,
	label,
}: {
	url: string;
	filename?: string;
	imagePreview: boolean;
	label: string;
}) {
	// A URL that no longer loads — a deleted storage object, a moment offline —
	// otherwise renders as the alt text spilling out of a 56px circle. The
	// caller keys this component on `url`, so this resets on replace.
	const [imageBroken, setImageBroken] = useState(false);

	if (imagePreview) {
		if (imageBroken) {
			return (
				<span
					className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
					title="This photo didn't load"
				>
					<ImageOff className="h-5 w-5" />
				</span>
			);
		}
		return (
			<img
				src={url}
				alt={`Current ${label.toLowerCase()}`}
				onError={() => setImageBroken(true)}
				className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
			/>
		);
	}

	return (
		<a
			href={url}
			target="_blank"
			rel="noreferrer noopener"
			className={cn(
				"flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5",
				"text-sm hover:bg-muted",
			)}
		>
			<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
			{/* The name can be long and this sits in a narrow column on phones —
			    truncate rather than let it push the buttons off the row. */}
			<span className="truncate">{filename ?? "Current file"}</span>
		</a>
	);
}
