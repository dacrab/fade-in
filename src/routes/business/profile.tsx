import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { Save, PlusCircle } from "lucide-react"
import { showToast } from "../../components/ui/Toast"
import { slugify } from "../../lib/format"
import type { Barbershop } from "../../types"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/business/profile")({ component: BusinessProfile })

interface ShopForm {
	name: string
	description: string
	phone: string
	address: string
	city: string
	instagram: string
	facebook: string
	website: string
}

const EMPTY: ShopForm = {
	name: "", description: "", phone: "",
	address: "", city: "",
	instagram: "", facebook: "", website: "",
}

function BusinessProfile() {
	const { user } = useAuth()
	const shopsRaw = useQuery(api.barbershops.listByOwner, user ? { ownerId: user.id as Id<"users"> } : "skip")
	const shop = shopsRaw?.[0] as Barbershop | undefined

	const [form, setForm] = useState<ShopForm>(EMPTY)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!shop) return
		setForm({
			name: shop.name,
			description: shop.description ?? "",
			phone: shop.phone ?? "",
			address: shop.address,
			city: shop.city,
			instagram: shop.socialLinks?.instagram ?? "",
			facebook: shop.socialLinks?.facebook ?? "",
			website: shop.socialLinks?.website ?? "",
		})
	}, [shop])

	const createShop = useMutation(api.barbershops.create)
	const updateShop = useMutation(api.barbershops.update)

	const set = (key: keyof ShopForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		setForm((f) => ({ ...f, [key]: e.target.value }))

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) return
		setSaving(true)
		const socialLinks = {
			instagram: form.instagram || undefined,
			facebook: form.facebook || undefined,
			website: form.website || undefined,
		}
		try {
			if (shop) {
				await updateShop({
					id: shop._id,
					name: form.name,
					description: form.description || undefined,
					phone: form.phone || undefined,
					address: form.address,
					city: form.city,
					socialLinks,
				})
				showToast("Shop profile updated!", "success")
			} else {
				await createShop({
					name: form.name,
					slug: slugify(form.name),
					ownerId: user.id as Id<"users">,
					description: form.description || undefined,
					phone: form.phone || undefined,
					address: form.address,
					city: form.city,
					socialLinks,
				})
				showToast("Shop created! Welcome to FadeIn 🎉", "success")
			}
		} catch { showToast("Failed to save", "error") }
		finally { setSaving(false) }
	}

	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-2xl">
				<div className="flex items-center gap-3 mb-6">
					<Link to="/business" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] no-underline">← Dashboard</Link>
					<span className="text-[var(--border)]">/</span>
					<h1 className="text-2xl font-bold text-[var(--text)]">{shop ? "Edit Shop Profile" : "Create Your Shop"}</h1>
				</div>

				<form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
					<div className="card p-5 space-y-4">
						<h2 className="font-bold text-[var(--text)]">Basic info</h2>
						<div>
							<label className="block text-sm font-medium text-[var(--text)] mb-1.5">Shop name *</label>
							<input className="input" placeholder="e.g. Nikos Barbershop" value={form.name} onChange={set("name")} required />
							{form.name && <p className="text-xs text-[var(--text-muted)] mt-1">URL: /barbershops/{slugify(form.name)}</p>}
						</div>
						<div>
							<label className="block text-sm font-medium text-[var(--text)] mb-1.5">Description</label>
							<textarea className="input resize-none" rows={3} placeholder="Tell customers about your shop..." value={form.description} onChange={set("description")} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-[var(--text)] mb-1.5">Phone</label>
								<input className="input" placeholder="+30 210 0000000" value={form.phone} onChange={set("phone")} type="tel" />
							</div>
							<div>
								<label className="block text-sm font-medium text-[var(--text)] mb-1.5">City *</label>
								<input className="input" placeholder="Athens" value={form.city} onChange={set("city")} required />
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-[var(--text)] mb-1.5">Address *</label>
							<input className="input" placeholder="Ermou 10, Athens" value={form.address} onChange={set("address")} required />
						</div>
					</div>

					<div className="card p-5 space-y-4">
						<h2 className="font-bold text-[var(--text)]">Social links</h2>
						{(["instagram", "facebook", "website"] as const).map((key) => (
							<div key={key}>
								<label className="block text-sm font-medium text-[var(--text)] mb-1.5">{key.charAt(0).toUpperCase() + key.slice(1)} URL</label>
								<input className="input" placeholder="https://..." value={form[key]} onChange={set(key)} type="url" />
							</div>
						))}
					</div>

					<button type="submit" disabled={saving} className="btn btn-primary gap-2">
						{shop ? <Save size={15} /> : <PlusCircle size={15} />}
						{saving ? "Saving..." : shop ? "Save changes" : "Create shop"}
					</button>
				</form>
			</div>
		</main>
	)
}
