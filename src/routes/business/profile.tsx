import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { PlusCircle, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { showToast, withToast } from "#/components/ui/Toast"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { OWNER_ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"
import { slugify } from "#/lib/format"
import type { WeekDay, WorkingHoursForm } from "#/types"
import { WEEK_DAYS } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"

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

// Matches the slot-generation defaults so shops without explicit hours keep
// booking availability unchanged.
const DEFAULT_DAY = { open: "09:00", close: "19:00", closed: false }
const DEFAULT_HOURS: WorkingHoursForm = Object.fromEntries(
	WEEK_DAYS.map((d) => [d, { ...DEFAULT_DAY }]),
) as WorkingHoursForm

function hoursFromShop(wh: Doc<"barbershops">["workingHours"]): WorkingHoursForm {
	if (!wh) return structuredClone(DEFAULT_HOURS)
	return Object.fromEntries(
		WEEK_DAYS.map((d) => [d, wh[d] ? { ...wh[d] } : { ...DEFAULT_DAY }]),
	) as WorkingHoursForm
}

function BusinessProfile() {
	const { t } = useTranslation()
	const { user } = useRequireRole(OWNER_ADMIN_ROLES, true)
	const router = useRouter()

	const [form, setForm] = useState(EMPTY)
	const set =
		(key: keyof ShopForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm((prev) => ({ ...prev, [key]: e.target.value }))

	const shop = useOwnerShop(user?.id)
	const [hours, setHours] = useState<WorkingHoursForm>(structuredClone(DEFAULT_HOURS))
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
		setHours(hoursFromShop(shop.workingHours))
	}, [shop])

	const setDay = (day: WeekDay, key: "open" | "close") => (e: React.ChangeEvent<HTMLInputElement>) =>
		setHours((prev) => ({ ...prev, [day]: { ...prev[day], [key]: e.target.value } }))

	const toggleClosed = (day: WeekDay) =>
		setHours((prev) => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }))

	const hoursValid = WEEK_DAYS.every((d) => {
		const h = hours[d]
		return h.closed || h.close > h.open
	})

	const createShop = useMutation(api.barbershops.create)
	const updateShop = useMutation(api.barbershops.update)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) return
		if (!hoursValid) {
			showToast(t("business.profile.hoursInvalid"), "error")
			return
		}
		setSaving(true)
		const socialLinks = {
			instagram: form.instagram || undefined,
			facebook: form.facebook || undefined,
			website: form.website || undefined,
		}
		const result = await withToast(
			() =>
				shop
					? updateShop({
							id: shop._id,
							name: form.name,
							description: form.description || undefined,
							phone: form.phone || undefined,
							address: form.address,
							city: form.city,
							socialLinks,
							workingHours: hours,
						})
					: createShop({
							name: form.name,
							slug: slugify(form.name),
							description: form.description || undefined,
							phone: form.phone || undefined,
							address: form.address,
							city: form.city,
							socialLinks,
							workingHours: hours,
						}),
			shop ? t("business.profile.saved") : t("business.profile.created"),
			t("errors.shopFailed"),
		)
		setSaving(false)
		if (result !== undefined && !shop) {
			void router.navigate({ to: "/business/overview" })
		}
	}

	return (
		<div className="px-8 py-8">
			<div className="max-w-2xl mx-auto px-6 py-8">
				<div className="mb-5">
					<h1 className="section-title">
						{shop ? t("business.profile.editTitle") : t("business.profile.createTitle")}
					</h1>
				</div>

				<form onSubmit={(e) => void handleSubmit(e)} className="space-y-10">
					<div className="space-y-5">
						<h2 className="text-[11px] font-medium text-(--text-subtle)">
							{t("business.profile.basicInfo")}
						</h2>
						<div>
							<label className="field-label" htmlFor="shop-name">
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
							<label className="field-label" htmlFor="shop-desc">
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
								<label className="field-label" htmlFor="shop-phone">
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
								<label className="field-label" htmlFor="shop-city">
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
							<label className="field-label" htmlFor="shop-address">
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

					<div className="space-y-3">
						<h2 className="text-[11px] font-medium text-(--text-subtle)">
							{t("business.profile.hoursTitle")}
						</h2>
						{WEEK_DAYS.map((day) => {
							const h = hours[day]
							return (
								<div key={day} className="flex items-center gap-3">
									<span className="w-24 text-sm text-(--text-muted)">{t(`days.${day}`)}</span>
									<label className="flex items-center gap-1.5 text-xs muted-sm cursor-pointer select-none">
										<input
											type="checkbox"
											checked={h.closed}
											onChange={() => toggleClosed(day)}
											className="accent-(--gold)"
										/>
										{t("business.profile.closed")}
									</label>
									<div className="ml-auto flex items-center gap-2">
										<input
											type="time"
											className="input w-auto px-2 py-1.5 text-xs disabled:opacity-40"
											value={h.open}
											onChange={setDay(day, "open")}
											disabled={h.closed}
											aria-label={t("business.profile.opensAt", { day: t(`days.${day}`) })}
										/>
										<span className="muted-xs">–</span>
										<input
											type="time"
											className="input w-auto px-2 py-1.5 text-xs disabled:opacity-40"
											value={h.close}
											onChange={setDay(day, "close")}
											disabled={h.closed}
											aria-label={t("business.profile.closesAt", { day: t(`days.${day}`) })}
										/>
									</div>
								</div>
							)
						})}
						{!hoursValid && (
							<p className="text-xs text-(--error)">{t("business.profile.hoursInvalid")}</p>
						)}
					</div>

					<div className="space-y-5">
						<h2 className="text-[11px] font-medium text-(--text-subtle)">
							{t("business.profile.socialLinks")}
						</h2>
						{(["instagram", "facebook", "website"] as const).map((key) => (
							<div key={key}>
								<label className="field-label" htmlFor={`social-${key}`}>
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
