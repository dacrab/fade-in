import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export function StatCard({
	icon: Icon,
	value,
	label,
}: {
	icon: LucideIcon
	value: ReactNode
	label: string
}) {
	return (
		<div className="card p-5">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-(--text-subtle)">
					{label}
				</p>
				<Icon size={15} strokeWidth={1.7} className="shrink-0 text-(--gold)" />
			</div>
			<div className="mt-3 font-serif text-[2rem] font-medium leading-none tracking-[-0.03em] text-(--text)">
				{value}
			</div>
		</div>
	)
}
