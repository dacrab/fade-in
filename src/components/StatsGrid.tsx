import type { LucideIcon } from "lucide-react"

interface StatItem {
	label: string
	value: string | number
	icon: LucideIcon
}

interface Props {
	stats: StatItem[]
	cols?: 2 | 3 | 4
}

const GRID_COLS = {
	2: "grid-cols-2",
	3: "grid-cols-3",
	4: "grid-cols-2 sm:grid-cols-4",
} as const

export default function StatsGrid({ stats, cols = 4 }: Props) {
	return (
		<div className={`grid ${GRID_COLS[cols]} gap-4`}>
			{stats.map(({ label, value, icon: Icon }) => (
				<div key={label} className="card p-4">
					<Icon size={18} className="text-[var(--gold)] mb-2" />
					<div className="text-2xl font-bold text-[var(--text)]">{value}</div>
					<div className="text-xs text-[var(--text-muted)]">{label}</div>
				</div>
			))}
		</div>
	)
}
