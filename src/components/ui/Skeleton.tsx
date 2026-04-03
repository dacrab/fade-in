import { cn } from "../../lib/cn"

interface SkeletonProps {
	className?: string
}

export function Skeleton({ className }: SkeletonProps) {
	return <div className={cn("skeleton", className)} />
}

export function ShopCardSkeleton() {
	return (
		<div className="card p-0 overflow-hidden">
			<Skeleton className="h-48 w-full rounded-none" />
			<div className="p-4 space-y-3">
				<Skeleton className="h-5 w-3/4" />
				<Skeleton className="h-4 w-1/2" />
				<Skeleton className="h-4 w-full" />
				<div className="flex gap-2">
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-6 w-16" />
				</div>
			</div>
		</div>
	)
}
