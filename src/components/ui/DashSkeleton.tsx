import { cn } from "#/lib/cn"
import { Skeleton } from "./Skeleton"

/** Placeholder shown while a role-gated dashboard resolves the current user. */
export function DashSkeleton({ className }: { className?: string }) {
	return (
		<div className={cn("space-y-4", className)}>
			<Skeleton className="h-8 w-48" />
			<div className="grid grid-cols-4 gap-3">
				{[0, 1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-16 rounded-xl" />
				))}
			</div>
			<Skeleton className="h-48 rounded-xl" />
		</div>
	)
}
