import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Check, Pencil, PlusCircle, Scissors, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import EmptyState from "#/components/EmptyState"
import SkeletonList from "#/components/SkeletonList"
import { showToast } from "#/components/ui/Toast"
import { useFormState } from "#/hooks/useFormState"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import type { Barber } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/barbers")({ component: BusinessBarbers })

interface BarberForm extends Record<string, string> {
	name: string
	bio: string
	specializations: string
}
const EMPTY: BarberForm = { name: "", bio: "", specializations: "" }

function BusinessBarbers() {
	const { t } = useTranslation()
	const { form, showForm, setShowForm, editId, set, reset, openEdit } = useFormState(EMPTY)

	const shop = useOwnerShop()
	const barbersRaw = useQuery(api.barbers.listByShop, shop ? { barbershopId: shop._id } : "skip")
	const barbers = barbersRaw as Barber[] | undefined

	const createBarber = useMutation(api.barbers.create)
	const updateBarber = useMutation(api.barbers.update)
	const removeBarber = useMutation(api.barbers.remove)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!shop) return
		const specs = form.specializations
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean)
		try {
			if (editId) {
				await updateBarber({
					id: editId as Id<"barbers">,
					name: form.name,
					bio: form.bio || undefined,
					specializations: specs,
				})
			} else {
				await createBarber({
					barbershopId: shop._id,
					name: form.name,
					bio: form.bio || undefined,
					specializations: specs,
				})
			}
			showToast(t("errors.barberSaved"), "success")
			reset()
		} catch {
			showToast(t("errors.barberFailed"), "error")
		}
	}

	const handleEdit = (b: Barber) =>
		openEdit({ name: b.name, bio: b.bio ?? "", specializations: b.specializations.join(", ") }, b._id)

	const handleDelete = async (id: Id<"barbers">) => {
		try {
			await removeBarber({ id })
			showToast(t("errors.barberRemoved"), "info")
		} catch {
			showToast(t("errors.barberFailed"), "error")
		}
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl">
				<div className="flex items-center justify-between mb-6">
					<div className="page-header">
						<a href="/business" className="breadcrumb-back">
							← {t("nav.business")}
						</a>
						<span className="breadcrumb-sep">/</span>
						<h1>{t("business.barbers.title")}</h1>
					</div>
					<button
						type="button"
						onClick={() => {
							reset()
							setShowForm(!showForm)
						}}
						className="btn btn-primary gap-2 text-sm"
					>
						{showForm ? <X size={15} /> : <PlusCircle size={15} />}
						{showForm ? t("common.cancel") : t("business.barbers.addBarber")}
					</button>
				</div>

				{showForm && (
					<div className="card p-5 mb-6 fade-up">
						<h2 className="font-bold text-[var(--text)] mb-4">
							{editId ? t("common.edit") : t("business.barbers.addBarber")}
						</h2>
						<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
							<div>
								<label className="form-label" htmlFor="barber-name">
									{t("form.nameStar")}
								</label>
								<input
									id="barber-name"
									className="input"
									placeholder={t("business.barbers.namePlaceholder")}
									value={form.name}
									onChange={set("name")}
									required
								/>
							</div>
							<div>
								<label className="form-label" htmlFor="barber-specs">
									{t("business.barbers.specializationsLabel")}
								</label>
								<input
									id="barber-specs"
									className="input"
									placeholder={t("business.barbers.specializationsPlaceholder")}
									value={form.specializations}
									onChange={set("specializations")}
								/>
							</div>
							<div>
								<label className="form-label" htmlFor="barber-bio">
									{t("form.descriptionLabel")}
								</label>
								<textarea
									id="barber-bio"
									className="input resize-none"
									rows={2}
									placeholder={t("business.barbers.bioPlaceholder")}
									value={form.bio}
									onChange={set("bio")}
								/>
							</div>
							<div className="flex gap-2">
								<button type="submit" className="btn btn-primary gap-1">
									<Check size={15} />
									{editId ? t("common.save") : t("business.barbers.addBarber")}
								</button>
								<button type="button" onClick={reset} className="btn btn-secondary">
									{t("common.cancel")}
								</button>
							</div>
						</form>
					</div>
				)}

				{barbers === undefined ? (
					<SkeletonList count={3} height="h-20" />
				) : barbers.length === 0 ? (
					<EmptyState icon={Scissors} message={t("business.barbers.noBarbers")} />
				) : (
					<div className="space-y-3">
						{barbers.map((b: Barber) => (
							<div key={b._id} className="card p-4 flex items-center gap-4">
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[var(--gold)] flex-shrink-0"
									style={{ background: "rgba(245,158,11,0.1)" }}
								>
									{b.name.charAt(0)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-[var(--text)] text-sm">{b.name}</div>
									{b.specializations.length > 0 && (
										<div className="text-xs text-[var(--text-muted)]">{b.specializations.join(", ")}</div>
									)}
									{b.bio && <div className="text-xs text-[var(--text-subtle)] truncate">{b.bio}</div>}
								</div>
								<div className="flex gap-1.5">
									<button type="button" onClick={() => handleEdit(b)} className="icon-btn btn-bare">
										<Pencil size={14} />
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(b._id)}
										className="icon-btn icon-btn-danger btn-bare"
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
