import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { PlusCircle, Pencil, Trash2, X, Check } from "lucide-react"
import { Skeleton } from "../../components/ui/Skeleton"
import { formatPrice } from "../../lib/format"
import { showToast } from "../../components/ui/Toast"
import type { Barbershop, Service } from "../../types"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/services")({ component: BusinessServices })

interface ServiceForm {
	name: string
	description: string
	price: string
	durationMinutes: string
	category: string
}

const EMPTY_FORM: ServiceForm = { name: "", description: "", price: "", durationMinutes: "30", category: "haircut" }
const CATEGORIES = ["haircut", "beard", "shave", "coloring", "treatment", "other"] as const
type Category = (typeof CATEGORIES)[number]

function BusinessServices() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<Id<"services"> | null>(null)
	const [form, setForm] = useState<ServiceForm>(EMPTY_FORM)

	const shopsRaw = useQuery(api.barbershops.listByOwner, user ? { ownerId: user.id as Id<"users"> } : "skip")
	const shop = shopsRaw?.[0] as Barbershop | undefined
	const servicesRaw = useQuery(api.services.listByShop, shop ? { barbershopId: shop._id } : "skip")
	const services = servicesRaw as Service[] | undefined

	const createService = useMutation(api.services.create)
	const updateService = useMutation(api.services.update)
	const removeService = useMutation(api.services.remove)

	const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false) }
	const set = (key: keyof ServiceForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
		setForm((f) => ({ ...f, [key]: e.target.value }))

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!shop) return
		const price = Math.round(parseFloat(form.price) * 100)
		const durationMinutes = parseInt(form.durationMinutes, 10)
		try {
			if (editId) {
				await updateService({ id: editId, name: form.name, description: form.description || undefined, price, durationMinutes, category: form.category })
				showToast(t("errors.serviceSaved"), "success")
			} else {
				await createService({ barbershopId: shop._id, name: form.name, description: form.description || undefined, price, durationMinutes, category: form.category })
				showToast(t("errors.serviceSaved"), "success")
			}
			resetForm()
		} catch { showToast(t("errors.serviceFailed"), "error") }
	}

	const handleEdit = (svc: Service) => {
		setForm({ name: svc.name, description: svc.description ?? "", price: (svc.price / 100).toFixed(2), durationMinutes: String(svc.durationMinutes), category: svc.category })
		setEditId(svc._id)
		setShowForm(true)
	}

	const handleDelete = async (id: Id<"services">) => {
		try { await removeService({ id }); showToast(t("errors.serviceSaved").replace("saved", "removed"), "info") }
		catch { showToast(t("errors.serviceFailed"), "error") }
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl">
				<div className="flex items-center justify-between mb-6">
					<div className="page-header">
						<Link to="/business" className="breadcrumb-back">← {t("nav.business")}</Link>
						<span className="breadcrumb-sep">/</span>
						<h1>{t("business.services.title")}</h1>
					</div>
					<button type="button" onClick={() => { resetForm(); setShowForm(!showForm) }} className="btn btn-primary gap-2 text-sm">
						{showForm ? <X size={15} /> : <PlusCircle size={15} />}
						{showForm ? t("common.cancel") : t("business.services.addService")}
					</button>
				</div>

				{showForm && (
					<div className="card p-5 mb-6 fade-up">
						<h2 className="font-bold text-[var(--text)] mb-4">{editId ? t("business.services.editService") : t("business.services.newService")}</h2>
						<form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="sm:col-span-2">
								<label className="form-label">{t("form.nameStar")}</label>
								<input className="input" placeholder={t("business.services.namePlaceholder")} value={form.name} onChange={set("name")} required />
							</div>
							<div>
								<label className="form-label">{t("form.priceLabel")} *</label>
								<input className="input" type="number" step="0.01" min="0" placeholder="15.00" value={form.price} onChange={set("price")} required />
							</div>
							<div>
								<label className="form-label">{t("form.durationLabel")} *</label>
								<input className="input" type="number" min="5" step="5" placeholder="30" value={form.durationMinutes} onChange={set("durationMinutes")} required />
							</div>
							<div>
								<label className="form-label">{t("form.categoryLabel")}</label>
								<select className="input" value={form.category} onChange={set("category")}>
									{CATEGORIES.map((c: Category) => (
										<option key={c} value={c}>{t(`business.services.categories.${c}`)}</option>
									))}
								</select>
							</div>
							<div className="sm:col-span-2">
								<label className="form-label">{t("form.descriptionLabel")}</label>
								<input className="input" placeholder={t("form.optional")} value={form.description} onChange={set("description")} />
							</div>
							<div className="sm:col-span-2 flex gap-2">
								<button type="submit" className="btn btn-primary gap-1">
									<Check size={15} />{editId ? t("common.save") : t("business.services.addService")}
								</button>
								<button type="button" onClick={resetForm} className="btn btn-secondary">{t("common.cancel")}</button>
							</div>
						</form>
					</div>
				)}

				{services === undefined ? (
					<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
				) : services.length === 0 ? (
					<div className="empty-state"><p className="text-sm">{t("business.services.noServices")}</p></div>
				) : (
					<div className="space-y-2">
						{services.map((svc: Service) => (
							<div key={svc._id} className="card p-4 flex items-center gap-4">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-[var(--text)] text-sm">{svc.name}</div>
									<div className="text-xs text-[var(--text-muted)]">
										{svc.durationMinutes} min · <span className="badge badge-gray">{t(`business.services.categories.${svc.category}` as const)}</span>
									</div>
								</div>
								<div className="text-sm font-bold text-[var(--gold)]">{formatPrice(svc.price)}</div>
								<div className="flex gap-1.5">
									<button type="button" onClick={() => handleEdit(svc)} className="icon-btn" style={{ background: "none", border: "none", cursor: "pointer" }}><Pencil size={14} /></button>
									<button type="button" onClick={() => void handleDelete(svc._id)} className="icon-btn icon-btn-danger" style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={14} /></button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
