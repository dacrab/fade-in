import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useTranslation } from "react-i18next"
import { CrudListPage } from "#/components/ui/CrudListPage"
import { FormActions } from "#/components/ui/FormActions"
import { RowActions } from "#/components/ui/RowActions"
import { useCrudForm } from "#/hooks/useCrudForm"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { OWNER_ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/barbers")({ component: BusinessBarbers })

interface BarberForm {
	name: string
	bio: string
	specializations: string
}
const EMPTY: BarberForm = { name: "", bio: "", specializations: "" }

function BusinessBarbers() {
	const { t } = useTranslation()
	const { user } = useRequireRole(OWNER_ADMIN_ROLES, true)

	const shop = useOwnerShop(user?.id)
	const barbers = useQuery(api.barbers.listByShop, shop ? { barbershopId: shop._id } : "skip")

	const createBarber = useMutation(api.barbers.create)
	const updateBarber = useMutation(api.barbers.update)
	const removeBarber = useMutation(api.barbers.remove)

	const crud = useCrudForm<BarberForm, Id<"barbers">>({
		empty: EMPTY,
		save: (form, editId) => {
			if (!shop) return null
			const payload = {
				name: form.name,
				bio: form.bio || undefined,
				specializations: form.specializations
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
			}
			return editId
				? updateBarber({ id: editId, ...payload })
				: createBarber({ barbershopId: shop._id, ...payload })
		},
		remove: (id) => removeBarber({ id }),
		messages: {
			saved: t("business.barbers.saved"),
			removed: t("business.barbers.removed"),
			failed: t("errors.barberFailed"),
		},
	})

	return (
		<CrudListPage
			title={t("business.barbers.title")}
			addLabel={t("business.barbers.addBarber")}
			showForm={crud.showForm}
			onToggleForm={crud.toggleForm}
			formTitle={crud.editId ? t("common.edit") : t("business.barbers.addBarber")}
			form={
				<form onSubmit={(e) => void crud.submit(e)} className="space-y-5">
					<div>
						<label className="field-label" htmlFor="barber-name">
							{t("form.nameStar")}
						</label>
						<input
							id="barber-name"
							className="input w-full text-sm"
							placeholder={t("business.barbers.namePlaceholder")}
							value={crud.form.name}
							onChange={(e) => crud.setForm((f) => ({ ...f, name: e.target.value }))}
							required
						/>
					</div>
					<div>
						<label className="field-label" htmlFor="barber-specs">
							{t("business.barbers.specializationsLabel")}
						</label>
						<input
							id="barber-specs"
							className="input w-full text-sm"
							placeholder={t("business.barbers.specializationsPlaceholder")}
							value={crud.form.specializations}
							onChange={(e) => crud.setForm((f) => ({ ...f, specializations: e.target.value }))}
						/>
					</div>
					<div>
						<label className="field-label" htmlFor="barber-bio">
							{t("form.descriptionLabel")}
						</label>
						<textarea
							id="barber-bio"
							className="w-full bg-(--bg-card) border border-(--border) rounded-lg px-4 py-3 main-sm placeholder:text-(--text-subtle) focus:outline-none focus:border-(--gold) transition-colors resize-none"
							rows={2}
							placeholder={t("business.barbers.bioPlaceholder")}
							value={crud.form.bio}
							onChange={(e) => crud.setForm((f) => ({ ...f, bio: e.target.value }))}
						/>
					</div>
					<FormActions
						submitLabel={crud.editId ? t("common.save") : t("business.barbers.addBarber")}
						onCancel={crud.reset}
					/>
				</form>
			}
			loading={barbers === undefined}
			empty={barbers?.length === 0}
			emptyText={t("business.barbers.noBarbers")}
		>
			{barbers?.map((b) => (
				<div key={b._id} className="flex items-center gap-4 py-4 group">
					<div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-(--gold) flex-shrink-0 bg-(--gold)/10">
						{b.name.charAt(0)}
					</div>
					<div className="flex-1 min-w-0">
						<div className="main-sm">{b.name}</div>
						{b.specializations.length > 0 && (
							<div className="field-hint">{b.specializations.join(", ")}</div>
						)}
						{b.bio && <div className="subtle-xs truncate mt-0.5">{b.bio}</div>}
					</div>
					<RowActions
						onEdit={() =>
							crud.edit(b._id, {
								name: b.name,
								bio: b.bio ?? "",
								specializations: b.specializations.join(", "),
							})
						}
						onDelete={() => void crud.removeRecord(b._id)}
					/>
				</div>
			))}
		</CrudListPage>
	)
}
