import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { PlusCircle, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import Breadcrumb from "#/components/Breadcrumb"
import { showToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import { useFormState } from "#/hooks/useFormState"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { slugify } from "#/lib/format"
import { api } from "../../../convex/_generated/api"
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
	const { user } = useAuth()
	const shop = useOwnerShop()
	const { form, setForm, set } = useFormState(EMPTY)
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
	}, [shop, setForm])

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
					ownerId: user.id as Id<"users">,
					description: form.description || undefined,
					phone: form.phone || undefined,
					address: form.address,
					city: form.city,
					socialLinks,
				})
				showToast(t("errors.shopCreated"), "success")
			}
		} catch {
			showToast(t("errors.shopFailed"), "error")
		} finally {
			setSaving(false)
		}
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-2xl">
				<Breadcrumb
					to="/business"
					label={t("nav.business")}
					title={shop ? t("business.profile.editTitle") : t("business.profile.createTitle")}
				/>

				<form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
					<div className="card p-5 space-y-4">
						<h2 className="font-bold text-[var(--text)]">{t("business.profile.basicInfo")}</h2>
						<div>
							<label className="form-label" htmlFor="shop-name">
								{t("form.nameStar")}
							</label>
							<input
								className="input"
								placeholder={t("business.profile.namePlaceholder")}
								value={form.name}
								onChange={set("name")}
								required
							/>
							{form.name && (
								<p className="text-xs text-[var(--text-muted)] mt-1">
									{t("business.profile.urlPreview", { slug: slugify(form.name) })}
								</p>
							)}
						</div>
						<div>
							<label className="form-label" htmlFor="shop-desc">
								{t("form.descriptionLabel")}
							</label>
							<textarea
								id="shop-desc"
								className="input resize-none"
								rows={3}
								placeholder={t("business.profile.descPlaceholder")}
								value={form.description}
								onChange={set("description")}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="form-label" htmlFor="shop-phone">
									{t("form.phoneLabel")}
								</label>
								<input
									className="input"
									placeholder={t("business.profile.phonePlaceholder")}
									value={form.phone}
									onChange={set("phone")}
									type="tel"
								/>
							</div>
							<div>
								<label className="form-label" htmlFor="shop-city">
									{t("form.cityStar")}
								</label>
								<input
									className="input"
									placeholder={t("form.cityPlaceholder")}
									value={form.city}
									onChange={set("city")}
									required
								/>
							</div>
						</div>
						<div>
							<label className="form-label" htmlFor="shop-address">
								{t("form.addressStar")}
							</label>
							<input
								className="input"
								placeholder={t("business.profile.addressPlaceholder")}
								value={form.address}
								onChange={set("address")}
								required
							/>
						</div>
					</div>

					<div className="card p-5 space-y-4">
						<h2 className="font-bold text-[var(--text)]">{t("business.profile.socialLinks")}</h2>
						{(["instagram", "facebook", "website"] as const).map((key) => (
							<div key={key}>
								<label className="form-label" htmlFor={`social-${key}`}>
									{t(`form.${key}Label`)}
								</label>
								<input
									id={`social-${key}`}
									className="input"
									placeholder="https://..."
									value={form[key]}
									onChange={set(key)}
									type="url"
								/>
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
