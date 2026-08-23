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
	loadingRows?: number
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
	loadingRows = 4,
	children,
}: CrudListPageProps) {
	const { t } = useTranslation()

	return (
		<div className="px-8 py-8">
			<div className="max-w-3xl mx-auto px-6 py-8">
				<div className="flex items-start justify-between mb-5">
					<div>
						<h1 className="section-title">{title}</h1>
					</div>
					<button type="button" onClick={onToggleForm} className="btn btn-primary btn-sm">
						{showForm ? <X size={13} /> : <PlusCircle size={13} />}
						{showForm ? t("common.cancel") : addLabel}
					</button>
				</div>

				{showForm && (
					<div className="rounded-xl border border-(--border) bg-(--bg-card) p-6 mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
						<h2 className="text-[11px] font-medium text-(--text-subtle) mb-5">{formTitle}</h2>
						{form}
					</div>
				)}

				{loading ? (
					<SkeletonRows count={loadingRows} className="h-14 rounded-lg" />
				) : empty ? (
					<p className="empty-text">{emptyText}</p>
				) : (
					<div className="divide-y divide-(--border)">{children}</div>
				)}
			</div>
		</div>
	)
}
