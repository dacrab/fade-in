import { PlusCircle, X } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { SkeletonRows } from "./Skeleton"

interface CrudListPageProps {
	title: string
	addLabel: string
	showForm: boolean
	onToggleForm: () => void
	formTitle: string
	form: ReactNode
	loading: boolean
	empty: boolean
	emptyText: string
	children: ReactNode
}

export function CrudListPage({
	title,
	addLabel,
	showForm,
	onToggleForm,
	formTitle,
	form,
	loading,
	empty,
	emptyText,
	children,
}: CrudListPageProps) {
	const { t } = useTranslation()

	return (
		<div className="mx-auto w-full max-w-4xl px-5 py-8 md:py-10">
			<div className="mb-6 flex items-start justify-between gap-4 border-b border-(--border) pb-5">
				<h1 className="page-title">{title}</h1>
				<button type="button" onClick={onToggleForm} className="btn btn-primary btn-sm">
					{showForm ? <X size={13} /> : <PlusCircle size={13} />}
					{showForm ? t("common.cancel") : addLabel}
				</button>
			</div>

			{showForm && (
				<div className="mb-5 rounded-(--radius-lg) border border-(--border) bg-(--bg-card) p-6 fade-in">
					<h2 className="mb-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-(--text-subtle)">
						{formTitle}
					</h2>
					{form}
				</div>
			)}

			{loading ? (
				<SkeletonRows count={4} className="h-14 rounded-(--radius)" />
			) : empty ? (
				<p className="empty-text">{emptyText}</p>
			) : (
				<div className="divide-y divide-(--border) rounded-(--radius-lg) border border-(--border) bg-(--bg-card) px-5">
					{children}
				</div>
			)}
		</div>
	)
}
