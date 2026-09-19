import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

interface FormActionsProps {
	/** Label for the submit button; the cancel label comes from `common.cancel`. */
	submitLabel: string
	onCancel: () => void
	className?: string
}

/** Submit + cancel footer shared by the business CRUD forms. */
export function FormActions({ submitLabel, onCancel, className = "flex gap-3" }: FormActionsProps) {
	const { t } = useTranslation()
	return (
		<div className={className}>
			<button type="submit" className="btn btn-primary btn-sm">
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
