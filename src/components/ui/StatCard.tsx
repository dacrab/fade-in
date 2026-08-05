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
		<div className="card p-3 flex items-center gap-3">
			<Icon size={16} className="text-(--gold) shrink-0" />
			<div>
				<div className="stat-value">{value}</div>
				<div className="muted-tiny">{label}</div>
			</div>
		</div>
	)
}
