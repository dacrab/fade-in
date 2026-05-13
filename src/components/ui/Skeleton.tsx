import { cn } from "#/lib/cn"

export function Skeleton({ className }: { className?: string }) {
	return <div className={cn("animate-pulse rounded-lg bg-stone-200/60", className)} />
}

export function ShopCardSkeleton() {
	return (
		<div className="bg-white rounded-2xl border border-(--border) shadow-sm overflow-hidden">
			<div className="animate-pulse bg-stone-200/60 h-48 w-full" />
			<div className="p-5 space-y-3">
				<div className="animate-pulse bg-stone-200/60 h-5 w-3/4 rounded-full" />
				<div className="animate-pulse bg-stone-200/60 h-4 w-1/2 rounded-full" />
				<div className="animate-pulse bg-stone-200/60 h-4 w-full rounded-full" />
				<div className="flex gap-2 pt-1">
					<div className="animate-pulse bg-stone-200/60 h-6 w-16 rounded-full" />
					<div className="animate-pulse bg-stone-200/60 h-6 w-16 rounded-full" />
				</div>
			</div>
		</div>
	)
}
