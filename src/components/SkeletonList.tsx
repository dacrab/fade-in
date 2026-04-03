import { Skeleton } from "#/components/ui/Skeleton"

interface Props {
	count?: number
	height?: string
	className?: string
}

/** Renders N skeleton rows for loading states. */
export default function SkeletonList({ count = 3, height = "h-16", className = "" }: Props) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
				<Skeleton key={i} className={`${height} w-full rounded-xl ${className}`} />
			))}
		</div>
	)
}
