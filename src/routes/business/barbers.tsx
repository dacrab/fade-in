import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Check, Pencil, PlusCircle, Trash2, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { showToast } from "#/components/ui/Toast"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
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
	const { user } = useBusinessAuth()

	const [form, setForm] = useState<BarberForm>(EMPTY)
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<Id<"barbers"> | null>(null)

	const shop = useOwnerShop(user?.id)
	const barbers = useQuery(api.barbers.listByShop, shop ? { barbershopId: shop._id } : "skip")

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
					id: editId,
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
		<div className="px-8 py-8">
			<div className="max-w-3xl mx-auto px-6 py-8">
				<div className="flex items-start justify-between mb-5">
					<div>
						<h1 className="text-lg font-medium text-(--text) tracking-tight">
							{t("business.barbers.title")}
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
						{showForm ? t("common.cancel") : t("business.barbers.addBarber")}
					</button>
				</div>

				{showForm && (
					<div className="rounded-xl border border-(--border) bg-(--bg-card) p-6 mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
						<h2 className="text-[11px] font-medium text-(--text-subtle) mb-5">
							{editId ? t("common.edit") : t("business.barbers.addBarber")}
						</h2>
						<form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
							<div>
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="barber-name">
									{t("form.nameStar")}
								</label>
								<input
									id="barber-name"
									className="input w-full text-sm"
									placeholder={t("business.barbers.namePlaceholder")}
									value={form.name}
									onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
									required
								/>
							</div>
							<div>
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="barber-specs">
									{t("business.barbers.specializationsLabel")}
								</label>
								<input
									id="barber-specs"
									className="input w-full text-sm"
									placeholder={t("business.barbers.specializationsPlaceholder")}
									value={form.specializations}
									onChange={(e) => setForm((f) => ({ ...f, specializations: e.target.value }))}
								/>
							</div>
							<div>
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="barber-bio">
									{t("form.descriptionLabel")}
								</label>
								<textarea
									id="barber-bio"
									className="w-full bg-white border border-(--border) rounded-lg px-4 py-3 text-sm text-(--text) placeholder:text-(--text-subtle) focus:outline-none focus:border-(--gold) transition-colors resize-none"
									rows={2}
									placeholder={t("business.barbers.bioPlaceholder")}
									value={form.bio}
									onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
								/>
							</div>
							<div className="flex gap-3">
								<button type="submit" className="btn btn-primary text-xs">
									<Check size={13} />
									{editId ? t("common.save") : t("business.barbers.addBarber")}
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

				{!barbers ? (
					<div className="space-y-3">
						{[0, 1, 2].map((i) => (
							<Skeleton key={i} className="h-14 w-full rounded-lg" />
						))}
					</div>
				) : barbers.length === 0 ? (
					<p className="text-sm text-(--text-subtle) py-8 text-center">
						{t("business.barbers.noBarbers")}
					</p>
				) : (
					<div className="divide-y divide-white/4">
						{barbers.map((b) => (
							<div key={b._id} className="flex items-center gap-4 py-4 group">
								<div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-(--gold) flex-shrink-0 bg-(--gold)/10">
									{b.name.charAt(0)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="text-sm text-(--text)">{b.name}</div>
									{b.specializations.length > 0 && (
										<div className="text-xs text-(--text-subtle) mt-0.5">{b.specializations.join(", ")}</div>
									)}
									{b.bio && <div className="text-xs text-(--text-subtle) truncate mt-0.5">{b.bio}</div>}
								</div>
								<div className="flex gap-1">
									<button
										type="button"
										onClick={() => handleEdit(b)}
										className="p-1.5 rounded-md text-(--text-subtle) opacity-0 group-hover:opacity-100 hover:text-(--text-muted) transition-all"
									>
										<Pencil size={13} />
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(b._id)}
										className="p-1.5 rounded-md text-(--text-subtle) opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
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
