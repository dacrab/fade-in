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
		<div className="flex items-center gap-0.5">
			{Array.from({ length: max }, (_, i) => (
				<button
					// biome-ignore lint/suspicious/noArrayIndexKey: star positions are inherently index-based
					key={i}
					type="button"
					onClick={() => interactive && onRate?.(i + 1)}
					className={cn(
						"bg-transparent border-0 p-0",
						interactive
							? "cursor-pointer hover:scale-110 transition-transform"
							: "cursor-default pointer-events-none",
					)}
				>
					<Star
						size={size}
						className={i < Math.floor(rating) ? "star" : "star-empty"}
						fill={i < Math.floor(rating) ? "currentColor" : "none"}
					/>
				</button>
			))}
		</div>
	)
}
