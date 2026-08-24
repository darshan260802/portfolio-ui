import { cn } from "@/lib/utils";

interface TemplateThumbnailProps {
	src: string;
	alt: string;
	/** Extra classes for the outer 16:9 frame. */
	className?: string;
	/** Extra classes for the artwork itself — e.g. the gallery's hover zoom. */
	imageClassName?: string;
	loading?: "eager" | "lazy";
}

/**
 * The one way a template's thumbnail is ever rendered — gallery cards and
 * the Settings template picker both go through this.
 *
 * The five thumbnails are not a uniform set: some are square, some are
 * closer to 16:9. The gallery used to `object-cover` them into a 16:9
 * frame, which silently cropped the square ones — Aurora, Monolith and
 * Prism lost the top and bottom of their artwork (usually the wordmark),
 * so they read as a different, sloppier set than Nocturne and Atlas next
 * to them. `object-contain` shows every thumbnail whole, and a blurred,
 * scaled copy of the same image fills whatever the frame has left over, so
 * a square image is letterboxed in its own colors instead of against a
 * dead grey box. Every card ends up the same shape with nothing cropped,
 * whatever aspect ratio the source image happens to be.
 */
export function TemplateThumbnail({ src, alt, className, imageClassName, loading = "lazy" }: TemplateThumbnailProps) {
	return (
		<div className={cn("relative aspect-video w-full overflow-hidden bg-muted", className)}>
			<img
				src={src}
				alt=""
				aria-hidden
				loading={loading}
				className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-xl saturate-150"
			/>
			<img
				src={src}
				alt={alt}
				loading={loading}
				className={cn("relative h-full w-full object-contain", imageClassName)}
			/>
		</div>
	);
}
