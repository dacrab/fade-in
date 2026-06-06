import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Check, Pencil, PlusCircle, Trash2, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { showToast } from "#/components/ui/Toast"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
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
	const { user } = useBusinessAuth()

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
		try {
			if (editId) {
				await updateService({
					id: editId,
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
		<div className="px-8 py-8">
			<div className="max-w-3xl mx-auto px-6 py-8">
				<div className="flex items-start justify-between mb-5">
					<div>
						<h1 className="text-lg font-medium text-(--text) tracking-tight">
							{t("business.services.title")}
						</h1>
					</div>
					<button
						type="button"
						onClick={() => {
							reset()
							setShowForm(!showForm)
						}}
						className="btn btn-primary text-xs"
					>
						{showForm ? <X size={13} /> : <PlusCircle size={13} />}
						{showForm ? t("common.cancel") : t("business.services.addService")}
					</button>
				</div>

				{showForm && (
					<div className="rounded-xl border border-(--border) bg-(--bg-card) p-6 mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
						<h2 className="text-[11px] font-medium text-(--text-subtle) mb-5">
							{editId ? t("business.services.editService") : t("business.services.newService")}
						</h2>
						<form
							onSubmit={(e) => void handleSubmit(e)}
							className="grid grid-cols-1 sm:grid-cols-2 gap-5"
						>
							<div className="sm:col-span-2">
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="svc-name">
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
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="svc-price">
									{t("form.priceLabel")} *
								</label>
								<input
									className="input w-full text-sm"
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
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="svc-duration">
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
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="svc-category">
									{t("form.categoryLabel")}
								</label>
								<select
									id="svc-category"
									className="w-full bg-(--bg-card) border border-(--border) rounded-lg px-4 py-3 text-sm text-(--text) focus:outline-none focus:border-(--gold) transition-colors"
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
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="svc-desc">
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
								<button type="submit" className="btn btn-primary text-xs">
									<Check size={13} />
									{editId ? t("common.save") : t("business.services.addService")}
								</button>
								<button
									type="button"
									onClick={reset}
									className="px-4 py-2 rounded-full border border-(--border) text-xs text-(--text-muted) hover:text-(--text-muted) transition-colors"
								>
									{t("common.cancel")}
								</button>
							</div>
						</form>
					</div>
				)}

				{services === undefined ? (
					<div className="space-y-3">
						{[0, 1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-14 w-full rounded-lg" />
						))}
					</div>
				) : services.length === 0 ? (
					<p className="text-sm text-(--text-subtle) py-8 text-center">
						{t("business.services.noServices")}
					</p>
				) : (
					<div className="divide-y divide-white/4">
						{services.map((svc) => (
							<div key={svc._id} className="flex items-center gap-4 py-4 group">
								<div className="flex-1 min-w-0">
									<div className="text-sm text-(--text)">{svc.name}</div>
									<div className="text-xs text-(--text-subtle) mt-0.5">
										{svc.durationMinutes} min · {t(`business.services.categories.${svc.category}` as const)}
									</div>
								</div>
								<div className="text-sm font-medium text-(--gold)">{formatPrice(svc.price)}</div>
								<div className="flex gap-1">
									<button
										type="button"
										onClick={() => handleEdit(svc)}
										className="p-1.5 rounded-md text-(--text-subtle) opacity-0 group-hover:opacity-100 hover:text-(--text-muted) transition-all"
									>
										<Pencil size={13} />
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(svc._id)}
										className="p-1.5 rounded-md text-(--text-subtle) opacity-0 group-hover:opacity-100 hover:text-(--error) transition-all"
									>
										<Trash2 size={13} />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
