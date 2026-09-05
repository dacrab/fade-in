import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Check } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CrudListPage } from "#/components/ui/CrudListPage"
import { RowActions } from "#/components/ui/RowActions"
import { withToast } from "#/components/ui/Toast"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { OWNER_ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"
import { formatPrice } from "#/lib/format"
import type { Service } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/services")({ component: BusinessServices })

interface ServiceForm {
	name: string
	description: string
	price: string
	durationMinutes: string
	category: string
}

const EMPTY_FORM: ServiceForm = {
	name: "",
	description: "",
	price: "",
	durationMinutes: "30",
	category: "haircut",
}
const CATEGORIES = ["haircut", "beard", "shave", "coloring", "treatment", "other"] as const

function BusinessServices() {
	const { t } = useTranslation()
	const { user } = useRequireRole(OWNER_ADMIN_ROLES, true)

	const [form, setForm] = useState(EMPTY_FORM)
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<Id<"services"> | null>(null)

	const set =
		(key: keyof ServiceForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
			setForm((prev) => ({ ...prev, [key]: e.target.value }))

	const reset = () => {
		setForm(EMPTY_FORM)
		setShowForm(false)
		setEditId(null)
	}

	const openEdit = (data: ServiceForm, id: Id<"services">) => {
		setForm(data)
		setEditId(id)
		setShowForm(true)
	}

	const shop = useOwnerShop(user?.id)
	const services = useQuery(api.services.listByShop, shop ? { barbershopId: shop._id } : "skip")

	const createService = useMutation(api.services.create)
	const updateService = useMutation(api.services.update)
	const removeService = useMutation(api.services.remove)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!shop) return
		const price = Math.round(parseFloat(form.price) * 100)
		const durationMinutes = parseInt(form.durationMinutes, 10)
		const payload = {
			name: form.name,
			description: form.description || undefined,
			price,
			durationMinutes,
			category: form.category,
		}
		const result = await withToast(
			() =>
				editId
					? updateService({ id: editId, ...payload })
					: createService({ barbershopId: shop._id, ...payload }),
			t("business.services.saved"),
			t("errors.serviceFailed"),
		)
		if (result !== undefined) reset()
	}

	const handleEdit = (svc: Service) =>
		openEdit(
			{
				name: svc.name,
				description: svc.description ?? "",
				price: (svc.price / 100).toFixed(2),
				durationMinutes: String(svc.durationMinutes),
				category: svc.category,
			},
			svc._id,
		)

	const handleDelete = async (id: Id<"services">) =>
		withToast(() => removeService({ id }), t("business.services.removed"), t("errors.serviceFailed"))

	return (
		<CrudListPage
			title={t("business.services.title")}
			addLabel={t("business.services.addService")}
			showForm={showForm}
			onToggleForm={() => {
				reset()
				setShowForm(!showForm)
			}}
			formTitle={editId ? t("business.services.editService") : t("business.services.newService")}
			form={
				<form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
					<div className="sm:col-span-2">
						<label className="field-label" htmlFor="svc-name">
							{t("form.nameStar")}
						</label>
						<input
							className="input w-full text-sm"
							id="svc-name"
							placeholder={t("business.services.namePlaceholder")}
							value={form.name}
							onChange={set("name")}
							required
						/>
					</div>
					<div>
						<label className="field-label" htmlFor="svc-price">
							{t("form.priceLabel")} *
						</label>
						<input
							className="input w-full text-sm"
							type="number"
							step="0.01"
							min="0.01"
							placeholder="15.00"
							value={form.price}
							onChange={set("price")}
							required
						/>
					</div>
					<div>
						<label className="field-label" htmlFor="svc-duration">
							{t("form.durationLabel")} *
						</label>
						<input
							className="input w-full text-sm"
							type="number"
							min="5"
							step="5"
							placeholder="30"
							value={form.durationMinutes}
							onChange={set("durationMinutes")}
							required
						/>
					</div>
					<div>
						<label className="field-label" htmlFor="svc-category">
							{t("form.categoryLabel")}
						</label>
						<select
							id="svc-category"
							className="w-full bg-(--bg-card) border border-(--border) rounded-lg px-4 py-3 main-sm focus:outline-none focus:border-(--gold) transition-colors"
							value={form.category}
							onChange={set("category")}
						>
							{CATEGORIES.map((c) => (
								<option key={c} value={c}>
									{t(`business.services.categories.${c}`)}
								</option>
							))}
						</select>
					</div>
					<div className="sm:col-span-2">
						<label className="field-label" htmlFor="svc-desc">
							{t("form.descriptionLabel")}
						</label>
						<input
							className="input w-full text-sm"
							placeholder={t("form.optional")}
							value={form.description}
							onChange={set("description")}
						/>
					</div>
					<div className="sm:col-span-2 flex gap-3">
						<button type="submit" className="btn btn-primary btn-sm">
							<Check size={13} />
							{editId ? t("common.save") : t("business.services.addService")}
						</button>
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 rounded-full border border-(--border) muted-xs hover:text-(--text-muted) transition-colors"
						>
							{t("common.cancel")}
						</button>
					</div>
				</form>
			}
			loading={services === undefined}
			empty={services?.length === 0}
			emptyText={t("business.services.noServices")}
		>
			{services?.map((svc) => (
				<div key={svc._id} className="flex items-center gap-4 py-4 group">
					<div className="flex-1 min-w-0">
						<div className="main-sm">{svc.name}</div>
						<div className="field-hint">
							{svc.durationMinutes} min · {t(`business.services.categories.${svc.category}`)}
						</div>
					</div>
					<div className="text-sm font-medium text-(--gold)">{formatPrice(svc.price)}</div>
					<RowActions onEdit={() => handleEdit(svc)} onDelete={() => void handleDelete(svc._id)} />
				</div>
			))}
		</CrudListPage>
	)
}
