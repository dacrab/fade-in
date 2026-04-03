import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
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
	name: string; description: string; phone: string
	address: string; city: string
	instagram: string; facebook: string; website: string
}
const EMPTY: ShopForm = { name: "", description: "", phone: "", address: "", city: "", instagram: "", facebook: "", website: "" }

function BusinessProfile() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const shopsRaw = useQuery(api.barbershops.listByOwner, user ? { ownerId: user.id as Id<"users"> } : "skip")
	const shop = shopsRaw?.[0] as Barbershop | undefined
	const [form, setForm] = useState<ShopForm>(EMPTY)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!shop) return
		setForm({
			name: shop.name, description: shop.description ?? "", phone: shop.phone ?? "",
			address: shop.address, city: shop.city,
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
		const socialLinks = { instagram: form.instagram || undefined, facebook: form.facebook || undefined, website: form.website || undefined }
		try {
			if (shop) {
				await updateShop({ id: shop._id, name: form.name, description: form.description || undefined, phone: form.phone || undefined, address: form.address, city: form.city, socialLinks })
				showToast(t("errors.shopSaved"), "success")
			} else {
				await createShop({ name: form.name, slug: slugify(form.name), ownerId: user.id as Id<"users">, description: form.description || undefined, phone: form.phone || undefined, address: form.address, city: form.city, socialLinks })
				showToast(t("errors.shopCreated"), "success")
			}
		} catch { showToast(t("errors.shopFailed"), "error") }
		finally { setSaving(false) }
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-2xl">
				<div className="page-header">
					<Link to="/business" className="breadcrumb-back">← {t("nav.business")}</Link>
					<span className="breadcrumb-sep">/</span>
					<h1>{shop ? t("business.profile.editTitle") : t("business.profile.createTitle")}</h1>
				</div>

				<form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
					<div className="card p-5 space-y-4">
						<h2 className="font-bold text-[var(--text)]">{t("business.profile.basicInfo")}</h2>
						<div>
							<label className="form-label">{t("form.nameStar")}</label>
							<input className="input" placeholder={t("business.profile.namePlaceholder")} value={form.name} onChange={set("name")} required />
							{form.name && <p className="text-xs text-[var(--text-muted)] mt-1">{t("business.profile.urlPreview", { slug: slugify(form.name) })}</p>}
						</div>
						<div>
							<label className="form-label">{t("form.descriptionLabel")}</label>
							<textarea className="input resize-none" rows={3} placeholder={t("business.profile.descPlaceholder")} value={form.description} onChange={set("description")} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="form-label">{t("form.phoneLabel")}</label>
								<input className="input" placeholder={t("business.profile.phonePlaceholder")} value={form.phone} onChange={set("phone")} type="tel" />
							</div>
							<div>
								<label className="form-label">{t("form.cityStar")}</label>
								<input className="input" placeholder="Athens" value={form.city} onChange={set("city")} required />
							</div>
						</div>
						<div>
							<label className="form-label">{t("form.addressStar")}</label>
							<input className="input" placeholder={t("business.profile.addressPlaceholder")} value={form.address} onChange={set("address")} required />
						</div>
					</div>

					<div className="card p-5 space-y-4">
						<h2 className="font-bold text-[var(--text)]">{t("business.profile.socialLinks")}</h2>
						{(["instagram", "facebook", "website"] as const).map((key) => (
							<div key={key}>
								<label className="form-label">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
								<input className="input" placeholder="https://..." value={form[key]} onChange={set(key)} type="url" />
							</div>
						))}
					</div>

					<button type="submit" disabled={saving} className="btn btn-primary gap-2">
						{shop ? <Save size={15} /> : <PlusCircle size={15} />}
						{saving ? t("common.loading") : shop ? t("common.save") : t("business.createShop")}
					</button>
				</form>
			</div>
		</main>
	)
}
