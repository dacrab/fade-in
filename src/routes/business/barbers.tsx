import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Check, Pencil, PlusCircle, Scissors, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { showToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import type { Barber } from "#/types"
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
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!(loading || (user && ["owner", "admin"].includes(user.role)))) {
			void router.navigate({ to: "/home" })
		}
	}, [user, loading, router])

	const [form, setForm] = useState<BarberForm>(EMPTY)
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)

	const shopsRaw = useQuery(
		api.barbershops.listByOwner,
		user ? { ownerId: user.id as Id<"users"> } : "skip",
	)
	const shop = shopsRaw?.[0]
	const barbers = useQuery(api.barbers.listByShop, shop ? { barbershopId: shop._id } : "skip") as
		| Barber[]
		| undefined

	const createBarber = useMutation(api.barbers.create)
	const updateBarber = useMutation(api.barbers.update)
	const removeBarber = useMutation(api.barbers.remove)

	const reset = () => {
		setForm(EMPTY)
		setEditId(null)
		setShowForm(false)
	}

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

	const handleEdit = (b: Barber) => {
		setForm({ name: b.name, bio: b.bio ?? "", specializations: b.specializations.join(", ") })
		setEditId(b._id)
		setShowForm(true)
	}

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
						<Link to="/business/overview" className="breadcrumb-back">
							← {t("nav.business")}
						</Link>
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
									onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
									onChange={(e) => setForm((f) => ({ ...f, specializations: e.target.value }))}
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
									onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
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

				{!barbers ? (
					<div className="space-y-3">
						{Array.from({ length: 3 }, (_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
							<Skeleton key={i} className="h-20 w-full rounded-xl" />
						))}
					</div>
				) : barbers.length === 0 ? (
					<div className="empty-state">
						<Scissors size={36} className="mx-auto mb-3 opacity-30" />
						<p className="text-sm">{t("business.barbers.noBarbers")}</p>
					</div>
				) : (
					<div className="space-y-3">
						{barbers.map((b: Barber) => (
							<div key={b._id} className="card p-4 flex items-center gap-4">
								<div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[var(--gold)] flex-shrink-0 bg-[rgba(245,158,11,0.1)]">
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
