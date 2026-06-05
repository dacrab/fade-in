import { Star } from "lucide-react"
import { cn } from "#/lib/cn"

interface StarRatingProps {
	rating: number
	max?: number
	size?: number
	interactive?: boolean
	onRate?: (rating: number) => void
}

export function StarRating({
	rating,
	max = 5,
	size = 16,
	interactive = false,
	onRate,
}: StarRatingProps) {
	return (
		<div className="flex items-center gap-px">
			{Array.from({ length: max }, (_, i) => (
				<button
					// biome-ignore lint/suspicious/noArrayIndexKey: static list, order never changes
					key={i}
					type="button"
					onClick={() => interactive && onRate?.(i + 1)}
					className={cn(
						"bg-transparent border-0 p-0",
						interactive
							? "cursor-pointer hover:scale-125 transition-transform"
							: "cursor-default pointer-events-none",
					)}
				>
					<Star
						size={size}
						className={i < Math.floor(rating) ? "text-(--gold)" : "text-(--border)"}
						fill={i < Math.floor(rating) ? "currentColor" : "none"}
					/>
				</button>
			))}
		</div>
	)
}
