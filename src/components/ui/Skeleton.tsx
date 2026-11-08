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
		<div className="overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--bg-card)">
			<div className={cn(SKELETON, "aspect-[4/3] w-full rounded-none")} />
			<div className="space-y-3 p-5">
				<div className={cn(SKELETON, "h-5 w-3/4")} />
				<div className={cn(SKELETON, "h-4 w-1/2")} />
				<div className="flex items-center justify-between border-t border-(--border) pt-4">
					<div className={cn(SKELETON, "h-3 w-12")} />
					<div className={cn(SKELETON, "h-3 w-16")} />
				</div>
			</div>
		</div>
	)
}
