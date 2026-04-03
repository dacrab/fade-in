import { Star } from "lucide-react"

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
			{Array.from({ length: max }).map((_, i) => {
				const filled = i < Math.floor(rating)
				return (
					<button
						key={i}
						type="button"
						onClick={() => interactive && onRate?.(i + 1)}
						className={
							interactive
								? "cursor-pointer hover:scale-110 transition-transform"
								: "cursor-default pointer-events-none"
						}
						style={{ background: "none", border: "none", padding: 0 }}
					>
						<Star
							size={size}
							className={filled ? "star" : "star-empty"}
							fill={filled ? "currentColor" : "none"}
						/>
					</button>
				)
			})}
		</div>
	)
}
