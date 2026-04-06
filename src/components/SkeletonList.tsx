import { Skeleton } from "#/components/ui/Skeleton"

interface Props {
	count?: number
	height?: string
	className?: string
}

export default function SkeletonList({ count = 3, height = "h-16", className = "" }: Props) {
	return (
		<div className="space-y-3">
			{Array.from({ length: count }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
				<Skeleton key={i} className={`${height} w-full rounded-xl ${className}`} />
			))}
		</div>
	)
}
