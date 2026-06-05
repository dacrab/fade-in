import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { PlusCircle, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { showToast } from "#/components/ui/Toast"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { slugify } from "#/lib/format"
import { api } from "../../../convex/_generated/api"

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
	name: "",
	description: "",
	phone: "",
	address: "",
	city: "",
	instagram: "",
	facebook: "",
	website: "",
}
function BusinessProfile() {
	const { t } = useTranslation()
	const { user } = useBusinessAuth()
	const router = useRouter()

	const [form, setForm] = useState(EMPTY)
	const set =
		(key: keyof ShopForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm((prev) => ({ ...prev, [key]: e.target.value }))

	const shop = useOwnerShop(user?.id)
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
				showToast(t("errors.shopSaved"), "success")
			} else {
				await createShop({
					name: form.name,
					slug: slugify(form.name),
					description: form.description || undefined,
					phone: form.phone || undefined,
					address: form.address,
					city: form.city,
					socialLinks,
				})
				showToast(t("errors.shopCreated"), "success")
				void router.navigate({ to: "/business/overview" })
			}
		} catch {
			showToast(t("errors.shopFailed"), "error")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="px-8 py-8">
			<div className="max-w-2xl mx-auto px-6 py-8">
				<div className="mb-5">
					<h1 className="text-lg font-medium text-(--text) tracking-tight">
						{shop ? t("business.profile.editTitle") : t("business.profile.createTitle")}
					</h1>
				</div>

				<form onSubmit={(e) => void handleSubmit(e)} className="space-y-10">
					{/* Basic Info */}
					<div className="space-y-5">
						<h2 className="text-[11px] font-medium text-(--text-subtle)">
							{t("business.profile.basicInfo")}
						</h2>
						<div>
							<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="shop-name">
								{t("form.nameStar")}
							</label>
							<input
								className="input w-full text-sm"
								placeholder={t("business.profile.namePlaceholder")}
								value={form.name}
								onChange={set("name")}
								required
							/>
							{form.name && (
								<p className="text-[11px] text-(--text-subtle) mt-1.5">
									{t("business.profile.urlPreview", { slug: slugify(form.name) })}
								</p>
							)}
						</div>
						<div>
							<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="shop-desc">
								{t("form.descriptionLabel")}
							</label>
							<textarea
								id="shop-desc"
								className="input w-full text-sm resize-none"
								rows={3}
								placeholder={t("business.profile.descPlaceholder")}
								value={form.description}
								onChange={set("description")}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="shop-phone">
									{t("form.phoneLabel")}
								</label>
								<input
									className="input w-full text-sm"
									placeholder={t("business.profile.phonePlaceholder")}
									value={form.phone}
									onChange={set("phone")}
									type="tel"
								/>
							</div>
							<div>
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="shop-city">
									{t("form.cityStar")}
								</label>
								<input
									className="input w-full text-sm"
									placeholder={t("form.cityPlaceholder")}
									value={form.city}
									onChange={set("city")}
									required
								/>
							</div>
						</div>
						<div>
							<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor="shop-address">
								{t("form.addressStar")}
							</label>
							<input
								className="input w-full text-sm"
								placeholder={t("business.profile.addressPlaceholder")}
								value={form.address}
								onChange={set("address")}
								required
							/>
						</div>
					</div>

					{/* Social Links */}
					<div className="space-y-5">
						<h2 className="text-[11px] font-medium text-(--text-subtle)">
							{t("business.profile.socialLinks")}
						</h2>
						{(["instagram", "facebook", "website"] as const).map((key) => (
							<div key={key}>
								<label className="block text-xs text-(--text-muted) mb-1.5" htmlFor={`social-${key}`}>
									{t(`form.${key}Label`)}
								</label>
								<input
									id={`social-${key}`}
									className="input w-full text-sm"
									placeholder="https://..."
									value={form[key]}
									onChange={set(key)}
									type="url"
								/>
							</div>
						))}
					</div>

					<button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
						{shop ? <Save size={14} /> : <PlusCircle size={14} />}
						{saving ? t("common.loading") : shop ? t("common.save") : t("business.createShop")}
					</button>
				</form>
			</div>
		</div>
	)
}
