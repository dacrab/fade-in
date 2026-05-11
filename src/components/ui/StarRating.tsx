import { Star } from "lucide-react"
import { cn } from "#/lib/cn"

interface StarRatingProps {
	rating: number
	max?: number
	size?: number
	interactive?: boolean
	onRate?: (rating: number) => void
}

const KEYS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]

export function StarRating({
	rating,
	max = 5,
	size = 16,
	interactive = false,
	onRate,
}: StarRatingProps) {
	return (
		<div className="flex items-center gap-0.5">
			{KEYS.slice(0, max).map((key, i) => (
				<button
					key={key}
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
