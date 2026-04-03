import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Check, Pencil, PlusCircle, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import PageHeader from "#/components/PageHeader"
import { Skeleton } from "#/components/ui/Skeleton"
import { showToast } from "#/components/ui/Toast"
import { useFormState } from "#/hooks/useFormState"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { useRequireRole } from "#/hooks/useRequireRole"
import { formatPrice } from "#/lib/format"
import type { Service } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/services")({ component: BusinessServices })

interface ServiceForm extends Record<string, string> {
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
type Category = (typeof CATEGORIES)[number]

function BusinessServices() {
	useRequireRole(["owner", "admin"])
	const { t } = useTranslation()
	const { form, showForm, setShowForm, editId, set, reset, openEdit } = useFormState(EMPTY_FORM)

	const shop = useOwnerShop()
	const services = useQuery(api.services.listByShop, shop ? { barbershopId: shop._id } : "skip") as
		| Service[]
		| undefined

	const createService = useMutation(api.services.create)
	const updateService = useMutation(api.services.update)
	const removeService = useMutation(api.services.remove)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!shop) return
		const price = Math.round(parseFloat(form.price) * 100)
		const durationMinutes = parseInt(form.durationMinutes, 10)
		try {
			if (editId) {
				await updateService({
					id: editId as Id<"services">,
					name: form.name,
					description: form.description || undefined,
					price,
					durationMinutes,
					category: form.category,
				})
			} else {
				await createService({
					barbershopId: shop._id,
					name: form.name,
					description: form.description || undefined,
					price,
					durationMinutes,
					category: form.category,
				})
			}
			showToast(t("errors.serviceSaved"), "success")
			reset()
		} catch {
			showToast(t("errors.serviceFailed"), "error")
		}
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

	const handleDelete = async (id: Id<"services">) => {
		try {
			await removeService({ id })
			showToast(t("errors.serviceRemoved"), "info")
		} catch {
			showToast(t("errors.serviceFailed"), "error")
		}
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl">
				<PageHeader back="/business" backLabel={t("nav.business")} title={t("business.services.title")}>
					<button
						type="button"
						onClick={() => {
							reset()
							setShowForm(!showForm)
						}}
						className="btn btn-primary gap-2 text-sm"
					>
						{showForm ? <X size={15} /> : <PlusCircle size={15} />}
						{showForm ? t("common.cancel") : t("business.services.addService")}
					</button>
				</PageHeader>

				{showForm && (
					<div className="card p-5 mb-6 fade-up">
						<h2 className="font-bold text-[var(--text)] mb-4">
							{editId ? t("business.services.editService") : t("business.services.newService")}
						</h2>
						<form
							onSubmit={(e) => void handleSubmit(e)}
							className="grid grid-cols-1 sm:grid-cols-2 gap-4"
						>
							<div className="sm:col-span-2">
								<label className="form-label" htmlFor="svc-name">
									{t("form.nameStar")}
								</label>
								<input
									className="input"
									id="svc-name"
									placeholder={t("business.services.namePlaceholder")}
									value={form.name}
									onChange={set("name")}
									required
								/>
							</div>
							<div>
								<label className="form-label" htmlFor="svc-price">
									{t("form.priceLabel")} *
								</label>
								<input
									className="input"
									type="number"
									step="0.01"
									min="0"
									placeholder="15.00"
									value={form.price}
									onChange={set("price")}
									required
								/>
							</div>
							<div>
								<label className="form-label" htmlFor="svc-duration">
									{t("form.durationLabel")} *
								</label>
								<input
									className="input"
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
								<label className="form-label" htmlFor="svc-category">
									{t("form.categoryLabel")}
								</label>
								<select
									id="svc-category"
									className="input"
									value={form.category}
									onChange={set("category")}
								>
									{CATEGORIES.map((c: Category) => (
										<option key={c} value={c}>
											{t(`business.services.categories.${c}`)}
										</option>
									))}
								</select>
							</div>
							<div className="sm:col-span-2">
								<label className="form-label" htmlFor="svc-desc">
									{t("form.descriptionLabel")}
								</label>
								<input
									className="input"
									placeholder={t("form.optional")}
									value={form.description}
									onChange={set("description")}
								/>
							</div>
							<div className="sm:col-span-2 flex gap-2">
								<button type="submit" className="btn btn-primary gap-1">
									<Check size={15} />
									{editId ? t("common.save") : t("business.services.addService")}
								</button>
								<button type="button" onClick={reset} className="btn btn-secondary">
									{t("common.cancel")}
								</button>
							</div>
						</form>
					</div>
				)}

				{services === undefined ? (
					<div className="space-y-3">
						{Array.from({ length: 4 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
							<Skeleton key={i} className="h-16 w-full rounded-xl" />
						))}
					</div>
				) : services.length === 0 ? (
					<div className="empty-state">
						<p className="text-sm">{t("business.services.noServices")}</p>
					</div>
				) : (
					<div className="space-y-2">
						{services.map((svc: Service) => (
							<div key={svc._id} className="card p-4 flex items-center gap-4">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-[var(--text)] text-sm">{svc.name}</div>
									<div className="text-xs text-[var(--text-muted)]">
										{svc.durationMinutes} min ·{" "}
										<span className="badge badge-gray">
											{t(`business.services.categories.${svc.category}` as const)}
										</span>
									</div>
								</div>
								<div className="text-sm font-bold text-[var(--gold)]">{formatPrice(svc.price)}</div>
								<div className="flex gap-1.5">
									<button type="button" onClick={() => handleEdit(svc)} className="icon-btn btn-bare">
										<Pencil size={14} />
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(svc._id)}
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
