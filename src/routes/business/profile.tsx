import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { PlusCircle, Save, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { DashSkeleton } from "#/components/ui/DashSkeleton"
import { showToast, withToast } from "#/components/ui/Toast"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { OWNER_ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"
import type { WeekDay, WorkingHoursForm } from "#/types"
import { WEEK_DAYS } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc, Id } from "../../../convex/_generated/dataModel"
import { slugify } from "../../../convex/lib/slug"

export const Route = createFileRoute("/business/profile")({ component: BusinessProfile })

interface ShopForm {
	name: string
	description: string
	phone: string
	address: string
	city: string
	lat: string
	lng: string
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
	lat: "",
	lng: "",
	instagram: "",
	facebook: "",
	website: "",
}

// Matches the slot-generation defaults so shops without explicit hours keep
// booking availability unchanged.
const DEFAULT_DAY = { open: "09:00", close: "19:00", closed: false }

// Build the week explicitly (no Object.fromEntries + cast) so the compiler
// checks that every day key is present. Days missing from legacy DB rows
// fall back to DEFAULT_DAY.
function hoursFor(wh: Doc<"barbershops">["workingHours"]): WorkingHoursForm {
	const day = (d: WeekDay) => ({ ...(wh?.[d] ?? DEFAULT_DAY) })
	return {
		monday: day("monday"),
		tuesday: day("tuesday"),
		wednesday: day("wednesday"),
		thursday: day("thursday"),
		friday: day("friday"),
		saturday: day("saturday"),
		sunday: day("sunday"),
	}
}

// Empty or non-numeric coordinate inputs are omitted from the payload so the
// shop keeps whatever was stored before.
function coord(value: string): number | undefined {
	const trimmed = value.trim()
	if (trimmed === "") return undefined
	const num = Number(trimmed)
	return Number.isFinite(num) ? num : undefined
}

function BusinessProfile() {
	const { t } = useTranslation()
	const { user } = useRequireRole(OWNER_ADMIN_ROLES, true)
	const router = useRouter()

	const [form, setForm] = useState(EMPTY)
	const set =
		(key: keyof ShopForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm((prev) => ({ ...prev, [key]: e.target.value }))

	const { shop, isLoading } = useOwnerShop(Boolean(user))
	const [hours, setHours] = useState<WorkingHoursForm>(() => hoursFor(undefined))
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!shop) return
		setForm({
			name: shop.name,
			description: shop.description ?? "",
			phone: shop.phone ?? "",
			address: shop.address,
			city: shop.city,
			lat: shop.lat?.toString() ?? "",
			lng: shop.lng?.toString() ?? "",
			instagram: shop.socialLinks?.instagram ?? "",
			facebook: shop.socialLinks?.facebook ?? "",
			website: shop.socialLinks?.website ?? "",
		})
		setHours(hoursFor(shop.workingHours))
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
	const generateUploadUrl = useMutation(api.barbershops.generateUploadUrl)
	const addImage = useMutation(api.barbershops.addImage)
	const removeImage = useMutation(api.barbershops.removeImage)
	const [uploading, setUploading] = useState(false)

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		e.target.value = "" // allow re-selecting the same file
		if (!(file && shop)) return
		setUploading(true)
		try {
			const uploadUrl = await generateUploadUrl()
			const res = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type || "application/octet-stream" },
				body: file,
			})
			if (!res.ok) throw new Error("Upload failed")
			const { storageId } = (await res.json()) as { storageId: Id<"_storage"> }
			await addImage({ id: shop._id, storageId })
		} catch {
			showToast(t("business.profile.uploadFailed"), "error")
		} finally {
			setUploading(false)
		}
	}

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
							lat: coord(form.lat),
							lng: coord(form.lng),
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
							lat: coord(form.lat),
							lng: coord(form.lng),
							socialLinks,
							workingHours: hours,
						}),
			shop ? t("business.profile.saved") : t("business.profile.created"),
			t("errors.shopFailed"),
		)
		setSaving(false)
		if (result.ok && !shop) {
			void router.navigate({ to: "/business/overview" })
		}
	}

	if (isLoading) {
		return (
			<div className="px-8 py-8">
				<div className="max-w-2xl mx-auto px-6 py-8">
					<DashSkeleton className="w-full" />
				</div>
			</div>
		)
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
								id="shop-name"
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
									id="shop-phone"
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
									id="shop-city"
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
								id="shop-address"
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
							{t("business.profile.locationTitle")}
						</h2>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="field-label" htmlFor="shop-lat">
									{t("business.profile.latLabel")}
								</label>
								<input
									id="shop-lat"
									className="input w-full text-sm"
									value={form.lat}
									onChange={set("lat")}
									type="number"
									step="any"
								/>
							</div>
							<div>
								<label className="field-label" htmlFor="shop-lng">
									{t("business.profile.lngLabel")}
								</label>
								<input
									id="shop-lng"
									className="input w-full text-sm"
									value={form.lng}
									onChange={set("lng")}
									type="number"
									step="any"
								/>
							</div>
						</div>
						<p className="field-hint">{t("business.profile.locationHint")}</p>
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

					{shop && (
						<div className="space-y-5">
							<h2 className="text-[11px] font-medium text-(--text-subtle)">
								{t("business.profile.imagesTitle")}
							</h2>
							{shop.images.length > 0 && (
								<div className="flex flex-wrap gap-3">
									{shop.images.map((url) => (
										<div key={url} className="relative">
											<img
												src={url}
												alt=""
												className="w-20 h-20 object-cover rounded-lg border border-(--border)"
											/>
											<button
												type="button"
												onClick={() => void removeImage({ id: shop._id, url })}
												aria-label={t("business.profile.removeImage")}
												title={t("business.profile.removeImage")}
												className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-(--bg-card) border border-(--border) text-(--text-muted) hover:text-(--text)"
											>
												<X size={12} />
											</button>
										</div>
									))}
								</div>
							)}
							<div>
								<input
									id="shop-images"
									type="file"
									accept="image/*"
									className="sr-only"
									onChange={(e) => void handleImageUpload(e)}
									disabled={uploading}
								/>
								<label
									htmlFor="shop-images"
									className={`btn btn-secondary btn-sm inline-flex ${uploading ? "opacity-50 pointer-events-none" : ""}`}
								>
									{uploading ? (
										t("business.profile.uploading")
									) : (
										<>
											<PlusCircle size={14} />
											{t("business.profile.addImage")}
										</>
									)}
								</label>
							</div>
						</div>
					)}

					<button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
						{shop ? <Save size={14} /> : <PlusCircle size={14} />}
						{saving ? t("common.loading") : shop ? t("common.save") : t("business.createShop")}
					</button>
				</form>
			</div>
		</div>
	)
}
