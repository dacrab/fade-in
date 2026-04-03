import type { LucideIcon } from "lucide-react"

interface Props {
	icon: LucideIcon
	message: string
	children?: React.ReactNode
}

/** Displays a centered empty state with an icon, message, and optional CTA. */
export default function EmptyState({ icon: Icon, message, children }: Props) {
	return (
		<div className="empty-state">
			<Icon size={36} className="mx-auto mb-3 opacity-30" />
			<p className="text-sm">{message}</p>
			{children}
		</div>
	)
}
