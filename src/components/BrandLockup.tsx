import { cn } from "#/lib/cn"
import BrandMark from "./BrandMark"

/**
 * Brand mark plus the "FadeIn" wordmark. Shared by the header, footer, and
 * auth screen so the lockup is only defined once.
 */
export default function BrandLockup({
	size = 32,
	className,
	markClassName,
	wordmarkClassName,
	accentClassName = "text-(--gold)",
}: {
	size?: number
	className?: string
	markClassName?: string
	wordmarkClassName?: string
	accentClassName?: string
}) {
	return (
		<span className={cn("inline-flex items-center gap-2.5", className)}>
			<BrandMark size={size} className={markClassName} />
			<span
				className={cn("font-serif font-medium leading-none tracking-[-0.03em]", wordmarkClassName)}
			>
				Fade<span className={cn("italic", accentClassName)}>In</span>
			</span>
		</span>
	)
}
