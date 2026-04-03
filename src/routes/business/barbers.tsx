import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { PlusCircle, Pencil, Trash2, X, Check } from "lucide-react"
import { Skeleton } from "../../components/ui/Skeleton"
import { showToast } from "../../components/ui/Toast"
import type { Barbershop, Barber } from "../../types"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/barbers")({ component: BusinessBarbers })

interface BarberForm {
	name: string
	bio: string
	specializations: string
}

const EMPTY: BarberForm = { name: "", bio: "", specializations: "" }

function BusinessBarbers() {
	const { user } = useAuth()
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<Id<"barbers"> | null>(null)
	const [form, setForm] = useState<BarberForm>(EMPTY)

	const shopsRaw = useQuery(api.barbershops.listByOwner, user ? { ownerId: user.id as Id<"users"> } : "skip")
	const shop = shopsRaw?.[0] as Barbershop | undefined
	const barbersRaw = useQuery(api.barbers.listByShop, shop ? { barbershopId: shop._id } : "skip")
	const barbers = barbersRaw as Barber[] | undefined

	const createBarber = useMutation(api.barbers.create)
	const updateBarber = useMutation(api.barbers.update)
	const removeBarber = useMutation(api.barbers.remove)

	const resetForm = () => { setForm(EMPTY); setEditId(null); setShowForm(false) }
	const set = (key: keyof BarberForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		setForm((f) => ({ ...f, [key]: e.target.value }))

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!shop) return
		const specs = form.specializations.split(",").map((s) => s.trim()).filter(Boolean)
		try {
			if (editId) {
				await updateBarber({ id: editId, name: form.name, bio: form.bio || undefined, specializations: specs })
				showToast("Barber updated!", "success")
			} else {
				await createBarber({ barbershopId: shop._id, name: form.name, bio: form.bio || undefined, specializations: specs })
				showToast("Barber added!", "success")
			}
			resetForm()
		} catch { showToast("Failed to save barber", "error") }
	}

	const handleEdit = (b: Barber) => {
		setForm({ name: b.name, bio: b.bio ?? "", specializations: b.specializations.join(", ") })
		setEditId(b._id)
		setShowForm(true)
	}

	const handleDelete = async (id: Id<"barbers">) => {
		try { await removeBarber({ id }); showToast("Barber removed", "info") }
		catch { showToast("Failed to remove", "error") }
	}

	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-3xl">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<Link to="/business" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] no-underline">← Dashboard</Link>
						<span className="text-[var(--border)]">/</span>
						<h1 className="text-2xl font-bold text-[var(--text)]">Barbers</h1>
					</div>
					<button type="button" onClick={() => { resetForm(); setShowForm(!showForm) }} className="btn btn-primary gap-2 text-sm">
						{showForm ? <X size={15} /> : <PlusCircle size={15} />}
						{showForm ? "Cancel" : "Add barber"}
					</button>
				</div>

				{showForm && (
					<div className="card p-5 mb-6 fade-up">
						<h2 className="font-bold text-[var(--text)] mb-4">{editId ? "Edit barber" : "New barber"}</h2>
						<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-[var(--text)] mb-1.5">Name *</label>
								<input className="input" placeholder="e.g. Nikos" value={form.name} onChange={set("name")} required />
							</div>
							<div>
								<label className="block text-sm font-medium text-[var(--text)] mb-1.5">Specializations (comma-separated)</label>
								<input className="input" placeholder="Fades, Beards, Classic cuts" value={form.specializations} onChange={set("specializations")} />
							</div>
							<div>
								<label className="block text-sm font-medium text-[var(--text)] mb-1.5">Bio</label>
								<textarea className="input resize-none" rows={2} placeholder="Short bio..." value={form.bio} onChange={set("bio")} />
							</div>
							<div className="flex gap-2">
								<button type="submit" className="btn btn-primary gap-1"><Check size={15} />{editId ? "Save" : "Add barber"}</button>
								<button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
							</div>
						</form>
					</div>
				)}

				{barbers === undefined ? (
					<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
				) : barbers.length === 0 ? (
					<div className="text-center py-16 text-[var(--text-muted)]"><p className="text-sm">No barbers yet.</p></div>
				) : (
					<div className="space-y-3">
						{barbers.map((b: Barber) => (
							<div key={b._id} className="card p-4 flex items-center gap-4">
								<div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[var(--gold)] flex-shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
									{b.name.charAt(0)}
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-[var(--text)] text-sm">{b.name}</div>
									{b.specializations.length > 0 && <div className="text-xs text-[var(--text-muted)]">{b.specializations.join(", ")}</div>}
									{b.bio && <div className="text-xs text-[var(--text-subtle)] truncate">{b.bio}</div>}
								</div>
								<div className="flex gap-1.5">
									<button type="button" onClick={() => handleEdit(b)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)] transition-colors" style={{ background: "none", border: "none", cursor: "pointer" }}><Pencil size={14} /></button>
									<button type="button" onClick={() => void handleDelete(b._id)} className="p-2 rounded-lg text-[var(--error)] hover:bg-red-500/10 transition-colors" style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={14} /></button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
