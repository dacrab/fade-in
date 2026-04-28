import { cn } from "#/lib/cn"

export function Skeleton({ className }: { className?: string }) {
	return <div className={cn("skeleton", className)} />
}

export function ShopCardSkeleton() {
	return (
		<div className="card p-0 overflow-hidden">
			<div className="skeleton h-48 w-full rounded-none" />
			<div className="p-4 space-y-3">
				<div className="skeleton h-5 w-3/4" />
				<div className="skeleton h-4 w-1/2" />
				<div className="skeleton h-4 w-full" />
				<div className="flex gap-2">
					<div className="skeleton h-6 w-16" />
					<div className="skeleton h-6 w-16" />
				</div>
			</div>
		</div>
	)
}
