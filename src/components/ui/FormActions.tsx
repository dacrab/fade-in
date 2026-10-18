import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

interface FormActionsProps {
	/** Label for the submit button; the cancel label comes from `common.cancel`. */
	submitLabel: string
	onCancel: () => void
	className?: string
	/** Disables the submit button while a save is in flight. */
	saving?: boolean
}

/** Submit + cancel footer shared by the business CRUD forms. */
export function FormActions({
	submitLabel,
	onCancel,
	className = "flex gap-3",
	saving = false,
}: FormActionsProps) {
	const { t } = useTranslation()
	return (
		<div className={className}>
			<button
				type="submit"
				disabled={saving}
				className="btn btn-primary btn-sm disabled:opacity-60 disabled:cursor-not-allowed"
			>
				<Check size={13} />
				{submitLabel}
			</button>
			<button
				type="button"
				onClick={onCancel}
				className="px-4 py-2 rounded-full border border-(--border) muted-xs hover:text-(--text-muted) transition-colors"
			>
				{t("common.cancel")}
			</button>
		</div>
	)
}
