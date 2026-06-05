import { cn } from "#/lib/cn"

const SKELETON = "animate-pulse rounded-lg bg-(--bg-input)"

export function Skeleton({ className }: { className?: string }) {
	return <div className={cn(SKELETON, className)} />
}

export function ShopCardSkeleton() {
	return (
		<div className="bg-white rounded-2xl border border-(--border) shadow-sm overflow-hidden">
			<div className={`${SKELETON} h-48 w-full`} />
			<div className="p-5 space-y-3">
				<div className={`${SKELETON} h-5 w-3/4`} />
				<div className={`${SKELETON} h-4 w-1/2`} />
				<div className={`${SKELETON} h-4 w-full`} />
				<div className="flex gap-2 pt-1">
					<div className={`${SKELETON} h-6 w-16`} />
					<div className={`${SKELETON} h-6 w-16`} />
				</div>
			</div>
		</div>
	)
}
