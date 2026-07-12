import { Star } from "lucide-react"

interface StarRatingProps {
	rating: number
	max?: number
	size?: number
}

export function StarRating({ rating, max = 5, size = 16 }: StarRatingProps) {
	return (
		<div className="flex items-center gap-px">
			{Array.from({ length: max }, (_, i) => (
				<Star
					// biome-ignore lint/suspicious/noArrayIndexKey: static star list, order never changes
					key={i}
					size={size}
					className={i < Math.floor(rating) ? "text-(--gold)" : "text-(--border)"}
					fill={i < Math.floor(rating) ? "currentColor" : "none"}
				/>
			))}
		</div>
	)
}
