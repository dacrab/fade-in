import { Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface RowActionsProps {
	onEdit: () => void
	onDelete: () => void
}

/** Hover-revealed edit/delete buttons for a CRUD list row (requires `group` on the row). */
export function RowActions({ onEdit, onDelete }: RowActionsProps) {
	const { t } = useTranslation()
	return (
		<div className="flex gap-1">
			<button
				type="button"
				onClick={onEdit}
				aria-label={t("common.edit")}
				className="p-1.5 rounded-md text-(--text-subtle) opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 hover:text-(--text-muted) transition-all"
			>
				<Pencil size={13} />
			</button>
			<button
				type="button"
				onClick={onDelete}
				aria-label={t("common.delete")}
				className="p-1.5 rounded-md text-(--text-subtle) opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 hover:text-(--error) transition-all"
			>
				<Trash2 size={13} />
			</button>
		</div>
	)
}
