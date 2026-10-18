import { cn } from "#/lib/cn"

const SKELETON = "animate-pulse rounded-lg bg-(--bg-input)"

export function Skeleton({ className }: { className?: string }) {
	return <div className={cn(SKELETON, className)} />
}

export function SkeletonRows({ count, className }: { count: number; className?: string }) {
	return (
		<>
			{Array.from({ length: count }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
				<Skeleton key={i} className={cn("w-full", className)} />
			))}
		</>
	)
}

export function ShopCardSkeleton() {
	return (
		<div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-sm overflow-hidden">
			<div className={cn(SKELETON, "h-44 w-full")} />
			<div className="p-5 space-y-3">
				<div className={cn(SKELETON, "h-5 w-3/4")} />
				<div className={cn(SKELETON, "h-4 w-1/2")} />
				<div className={cn(SKELETON, "h-4 w-full")} />
				<div className="flex gap-2 pt-1">
					<div className={cn(SKELETON, "h-6 w-16")} />
					<div className={cn(SKELETON, "h-6 w-16")} />
				</div>
			</div>
		</div>
	)
}
