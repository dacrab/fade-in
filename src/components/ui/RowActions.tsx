import { Pencil, Trash2 } from "lucide-react"

interface RowActionsProps {
	onEdit: () => void
	onDelete: () => void
}

/** Hover-revealed edit/delete buttons for a CRUD list row (requires `group` on the row). */
export function RowActions({ onEdit, onDelete }: RowActionsProps) {
	return (
		<div className="flex gap-1">
			<button
				type="button"
				onClick={onEdit}
				className="p-1.5 rounded-md text-(--text-subtle) opacity-0 group-hover:opacity-100 hover:text-(--text-muted) transition-all"
			>
				<Pencil size={13} />
			</button>
			<button
				type="button"
				onClick={onDelete}
				className="p-1.5 rounded-md text-(--text-subtle) opacity-0 group-hover:opacity-100 hover:text-(--error) transition-all"
			>
				<Trash2 size={13} />
			</button>
		</div>
	)
}
