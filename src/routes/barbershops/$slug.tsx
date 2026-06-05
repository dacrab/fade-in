import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import {
	Calendar,
	Check,
	ChevronLeft,
	Clock,
	Copy,
	Globe,
	Link2,
	MapPin,
	Phone,
	QrCode,
	Scissors,
	Share2,
	Star,
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import BookingModal from "#/components/BookingModal"
import { Skeleton } from "#/components/ui/Skeleton"
import { StarRating } from "#/components/ui/StarRating"
import { withToast } from "#/components/ui/Toast"
import { capitalizeFirst, formatPrice, formatRelative } from "#/lib/format"
import type { Barber, Barbershop, Review, Service, WeekDay } from "#/types"
import { WEEK_DAYS } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/barbershops/$slug")({ component: ShopProfilePage })

function ShopProfilePage() {
	const { t } = useTranslation()
	const { slug } = Route.useParams()
	const shop = useQuery(api.barbershops.getBySlug, { slug }) as Barbershop | null | undefined
	const [bookingOpen, setBookingOpen] = useState(false)
	const [showQr, setShowQr] = useState(false)
	const bookingUrl =
		typeof window !== "undefined" ? `${window.location.origin}/barbershops/${slug}` : ""

	const handleCopyLink = () =>
		withToast(
			() => navigator.clipboard.writeText(bookingUrl),
			t("shop.linkCopied"),
			t("shop.linkCopyFailed"),
		)
	const services = useQuery(api.services.listByShop, shop ? { barbershopId: shop._id } : "skip") as
		| Service[]
		| undefined
	const barbers = useQuery(api.barbers.listByShop, shop ? { barbershopId: shop._id } : "skip") as
		| Barber[]
		| undefined
	const reviewsResult = useQuery(
		api.reviews.listByShop,
		shop ? { barbershopId: shop._id, paginationOpts: { cursor: null, numItems: 50 } } : "skip",
	)
	const reviews = reviewsResult?.page as Review[] | undefined

	if (shop === undefined) return <ShopProfileSkeleton />
	if (!shop)
		return (
			<main className="flex-1 flex items-center justify-center px-4">
				<div className="text-center">
					<div className="w-20 h-20 rounded-full bg-[var(--gold)/8] flex items-center justify-center mx-auto mb-6">
						<Scissors size={32} className="text-(--gold)/40" />
					</div>
					<h1 className="text-2xl font-bold text-(--text) mb-2">{t("shop.notFound")}</h1>
					<Link
						to="/barbershops/listing"
						className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-lg bg-(--gold) text-white text-sm font-medium hover:bg-(--gold-dark) transition-colors"
					>
						{t("shop.notFoundHint")}
					</Link>
				</div>
			</main>
		)

	return (
		<main className="page-main">
			{/* Hero Image - Full Width Bleed */}
			<div className="relative w-full h-[50vh] min-h-90 max-h-130 overflow-hidden">
				{shop.images[0] ? (
					<img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover" />
				) : (
					<div className="w-full h-full bg-gradient-to-br from-(--bg-card) to-(--bg) flex items-center justify-center">
						<Scissors size={80} className="text-(--text-subtle) opacity-30" />
					</div>
				)}
				{/* Gradient Overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

				{/* Back Button */}
				<Link
					to="/barbershops/listing"
					className="absolute top-6 left-6 flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/30 border border-white/10 text-white/90 text-sm font-medium hover:bg-black/50 transition-all duration-300"
				>
					<ChevronLeft size={16} /> {t("shop.back")}
				</Link>

				{/* Verified Badge */}
				{shop.isVerified && (
					<div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--gold)/90 text-white text-xs font-medium">
						<Check size={12} /> {t("common.verified")}
					</div>
				)}

				{/* Shop Name Overlaid */}
				<div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 pb-8">
					<div className="max-w-7xl mx-auto">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2">
							{shop.name}
						</h1>
						<div className="flex items-center gap-4 text-white/70 text-sm">
							<span className="flex items-center gap-1.5">
								<MapPin size={14} />
								{shop.address}, {shop.city}
							</span>
							{shop.phone && (
								<a
									href={`tel:${shop.phone}`}
									className="flex items-center gap-1.5 hover:text-white transition-colors"
								>
									<Phone size={14} />
									{shop.phone}
								</a>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-10">
						{/* Rating + Description */}
						<div>
							<div className="flex items-center gap-3 mb-4">
								<div className="flex items-center gap-2">
									<Star size={20} fill="currentColor" className="text-(--gold)" />
									<span className="text-2xl font-bold text-(--text)">{shop.rating.toFixed(1)}</span>
								</div>
								<span className="text-sm text-(--text-muted)">
									{t("map.reviewsCount", { count: shop.reviewCount })}
								</span>
							</div>
							{shop.description && (
								<p className="text-(--text-muted) leading-relaxed text-base">{shop.description}</p>
							)}
						</div>

						{/* Services */}
						<section>
							<h2 className="text-xl font-bold text-(--text) mb-5 tracking-tight">{t("shop.services")}</h2>
							{!services ? (
								<div className="space-y-3">
									{[0, 1, 2].map((i) => (
										<Skeleton key={i} className="h-14 w-full rounded-xl" />
									))}
								</div>
							) : services.length === 0 ? (
								<p className="text-sm text-(--text-muted)">{t("shop.noServices")}</p>
							) : (
								<div className="space-y-1">
									{services.map((svc: Service) => (
										<div
											key={svc._id}
											className="flex items-center justify-between py-4 px-4 rounded-xl hover:bg-[rgba(200,75,49,0.04)] transition-colors duration-200 group"
										>
											<div className="flex-1">
												<div className="font-medium text-(--text) text-sm group-hover:text-(--gold) transition-colors">
													{svc.name}
												</div>
												{svc.description && (
													<div className="text-xs text-(--text-muted) mt-0.5">{svc.description}</div>
												)}
											</div>
											<div className="flex items-center gap-4">
												<span className="text-xs text-(--text-subtle)">
													{svc.durationMinutes} {t("common.min")}
												</span>
												<span className="text-sm font-bold text-(--gold) min-w-15 text-right">
													{formatPrice(svc.price)}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						{/* Barbers - Horizontal Scroll */}
						<section>
							<h2 className="text-xl font-bold text-(--text) mb-5 tracking-tight">
								{t("shop.ourBarbers")}
							</h2>
							{!barbers ? (
								<div className="flex gap-4">
									{[0, 1, 2].map((i) => (
										<Skeleton key={i} className="h-24 w-24 rounded-2xl flex-shrink-0" />
									))}
								</div>
							) : barbers.length === 0 ? (
								<p className="text-sm text-(--text-muted)">{t("shop.noBarbers")}</p>
							) : (
								<div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
									{barbers.map((b: Barber) => (
										<div
											key={b._id}
											className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-(--bg-card) border border-[var(--gold)/10] min-w-30 flex-shrink-0 hover:border-(--gold)/30 transition-all duration-300"
										>
											<div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--gold)/8] flex items-center justify-center ring-2 ring-[var(--gold)/15]">
												{b.avatarUrl ? (
													<img src={b.avatarUrl} alt={b.name} className="w-full h-full object-cover" />
												) : (
													<span className="text-lg font-bold text-(--gold)">{b.name.charAt(0)}</span>
												)}
											</div>
											<div className="text-center">
												<div className="text-sm font-semibold text-(--text)">{b.name}</div>
												{b.specializations[0] && (
													<div className="text-[11px] text-(--text-muted) mt-0.5">{b.specializations[0]}</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						{/* Reviews - Editorial Style */}
						<section>
							<div className="flex items-baseline gap-4 mb-6">
								<h2 className="text-xl font-bold text-(--text) tracking-tight">{t("shop.reviewsTitle")}</h2>
								{reviews && reviews.length > 0 && (
									<span className="text-4xl font-bold text-(--gold)">{shop.rating.toFixed(1)}</span>
								)}
							</div>
							{!reviews ? (
								<div className="space-y-4">
									{[0, 1, 2].map((i) => (
										<Skeleton key={i} className="h-20 w-full rounded-xl" />
									))}
								</div>
							) : reviews.length === 0 ? (
								<p className="text-sm text-(--text-muted)">{t("shop.noReviews")}</p>
							) : (
								<div className="space-y-4">
									{reviews.map((r: Review) => (
										<div key={r._id} className="pb-6 border-b border-(--border) last:border-0 last:pb-0">
											<div className="flex items-center gap-3 mb-2">
												<StarRating rating={r.rating} size={13} />
												<span className="text-xs text-(--text-subtle) tracking-wide">
													{formatRelative(r.createdAt)}
												</span>
											</div>
											<p className="text-sm text-(--text) leading-relaxed">{r.comment}</p>
											{r.ownerReply && (
												<div className="mt-3 pl-4 border-l-2 border-(--gold)/25">
													<p className="text-xs text-(--text-muted) leading-relaxed">
														<span className="text-(--gold) font-semibold">{t("shop.ownerReply")}</span>{" "}
														{r.ownerReply}
													</p>
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</section>
					</div>

					{/* Sidebar */}
					<div className="space-y-5">
						{/* Booking CTA - Sticky */}
						<div className="lg:sticky lg:top-6">
							<div className="rounded-2xl bg-(--bg-card) border border-[rgba(200,75,49,0.12)] p-6 mb-5">
								<h3 className="font-bold text-(--text) mb-4 text-lg">{t("shop.bookAppointment")}</h3>
								<button
									type="button"
									onClick={() => setBookingOpen(true)}
									className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-(--gold) text-white font-medium text-sm hover:bg-(--gold-dark) transition-all duration-300 shadow-[0_4px_16px_rgba(200,75,49,0.25)] hover:shadow-[0_6px_24px_rgba(200,75,49,0.35)]"
								>
									<Calendar size={16} /> {t("common.bookNow")}
								</button>
							</div>

							{/* Working Hours */}
							{shop.workingHours && (
								<div className="rounded-2xl bg-(--bg-card) border border-[var(--gold)/8] p-6 mb-5">
									<h3 className="font-semibold text-(--text) mb-4 flex items-center gap-2 text-sm">
										<Clock size={14} className="text-(--gold)" /> {t("shop.hours")}
									</h3>
									<div className="grid grid-cols-2 gap-x-4 gap-y-2">
										{WEEK_DAYS.map((day: WeekDay) => {
											const h = shop.workingHours?.[day]
											return (
												<div key={day} className="contents">
													<span className="text-xs text-(--text-muted)">{capitalizeFirst(day)}</span>
													<span
														className={`text-xs text-right ${h?.closed ? "text-(--error)" : "text-(--text)"}`}
													>
														{h?.closed ? t("shop.closed") : h ? `${h.open}–${h.close}` : "–"}
													</span>
												</div>
											)
										})}
									</div>
								</div>
							)}

							{/* Share / QR - Subtle */}
							<div className="rounded-2xl bg-(--bg-card) border border-[var(--gold)/8] p-5">
								<div className="flex items-center gap-2 mb-3">
									<Share2 size={13} className="text-(--text-subtle)" />
									<span className="text-xs font-medium text-(--text-muted)">{t("shop.shareTitle")}</span>
								</div>
								<div className="flex gap-2 mb-2">
									<input
										readOnly
										value={bookingUrl}
										className="flex-1 min-w-0 bg-(--bg) border border-(--border) rounded-full px-3 py-2 text-[11px] text-(--text-muted) outline-none"
									/>
									<button
										type="button"
										onClick={() => void handleCopyLink()}
										className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--gold)/8] flex items-center justify-center text-(--text-muted) hover:text-(--gold) hover:bg-[var(--gold)/15] transition-all"
										title={t("shop.copyLink")}
									>
										<Copy size={13} />
									</button>
								</div>
								<button
									type="button"
									onClick={() => setShowQr((v) => !v)}
									className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-(--text-subtle) hover:text-(--gold) transition-colors"
								>
									<QrCode size={12} /> {showQr ? t("shop.hideQr") : t("shop.showQr")}
								</button>
								{showQr && (
									<div className="flex justify-center mt-3 p-4 bg-white rounded-xl">
										<QRCodeSVG value={bookingUrl} size={140} />
									</div>
								)}
							</div>

							{/* Social Links */}
							{shop.socialLinks && (
								<div className="flex items-center gap-2 mt-4 px-2">
									{shop.socialLinks.instagram && (
										<a
											href={shop.socialLinks.instagram}
											target="_blank"
											rel="noreferrer"
											className="w-9 h-9 rounded-full bg-(--bg-card) border border-[var(--gold)/10] flex items-center justify-center text-(--text-muted) hover:text-(--gold) hover:border-(--gold)/30 transition-all duration-300"
										>
											<Link2 size={15} />
										</a>
									)}
									{shop.socialLinks.facebook && (
										<a
											href={shop.socialLinks.facebook}
											target="_blank"
											rel="noreferrer"
											className="w-9 h-9 rounded-full bg-(--bg-card) border border-[var(--gold)/10] flex items-center justify-center text-(--text-muted) hover:text-(--gold) hover:border-(--gold)/30 transition-all duration-300"
										>
											<Share2 size={15} />
										</a>
									)}
									{shop.socialLinks.website && (
										<a
											href={shop.socialLinks.website}
											target="_blank"
											rel="noreferrer"
											className="w-9 h-9 rounded-full bg-(--bg-card) border border-[var(--gold)/10] flex items-center justify-center text-(--text-muted) hover:text-(--gold) hover:border-(--gold)/30 transition-all duration-300"
										>
											<Globe size={15} />
										</a>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			{bookingOpen && <BookingModal shop={shop} onClose={() => setBookingOpen(false)} />}
		</main>
	)
}

function ShopProfileSkeleton() {
	return (
		<main className="page-main">
			<Skeleton className="h-[50vh] w-full" />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-4">
						<Skeleton className="h-8 w-48 rounded-xl" />
						<Skeleton className="h-4 w-full rounded-lg" />
						<Skeleton className="h-4 w-3/4 rounded-lg" />
						<Skeleton className="h-48 w-full rounded-2xl" />
					</div>
					<div>
						<Skeleton className="h-40 w-full rounded-2xl" />
					</div>
				</div>
			</div>
		</main>
	)
}
