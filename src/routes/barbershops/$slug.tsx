import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { MapPin, Phone, Clock, Star, Scissors, Instagram, Facebook, Globe, ChevronLeft, Calendar, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { StarRating } from "../../components/ui/StarRating"
import { Skeleton } from "../../components/ui/Skeleton"
import { formatPrice, formatRelative, capitalizeFirst } from "../../lib/format"
import { useState } from "react"
import BookingModal from "../../components/BookingModal"
import type { Barbershop, Barber, Service, Review, WeekDay } from "../../types"
import { WEEK_DAYS } from "../../types"

export const Route = createFileRoute("/barbershops/$slug")({ component: ShopProfilePage })

function ShopProfilePage() {
	const { t } = useTranslation()
	const { slug } = Route.useParams()
	const shopRaw = useQuery(api.barbershops.getBySlug, { slug })
	const [bookingOpen, setBookingOpen] = useState(false)

	const shop = shopRaw as Barbershop | null | undefined
	const services = useQuery(api.services.listByShop, shop ? { barbershopId: shop._id } : "skip") as Service[] | undefined
	const barbers = useQuery(api.barbers.listByShop, shop ? { barbershopId: shop._id } : "skip") as Barber[] | undefined
	const reviews = useQuery(api.reviews.listByShop, shop ? { barbershopId: shop._id } : "skip") as Review[] | undefined

	if (shop === undefined) return <ShopProfileSkeleton />
	if (!shop) return (
		<main className="px-4 py-16 text-center page-wrap">
			<Scissors size={40} className="mx-auto mb-4 text-[var(--text-subtle)]" />
			<h1 className="text-2xl font-bold text-[var(--text)] mb-2">{t("shop.notFound")}</h1>
			<Link to="/barbershops" className="btn btn-primary mt-4 inline-flex">{t("shop.notFoundHint")}</Link>
		</main>
	)

	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-5xl">
				<Link to="/barbershops" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text)] no-underline mb-6 transition-colors">
					<ChevronLeft size={16} /> {t("shop.back")}
				</Link>

				<div className="rounded-2xl overflow-hidden mb-6 h-64 sm:h-80 bg-[var(--bg-card-hover)] relative">
					{shop.images[0] ? (
						<img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover" />
					) : (
						<div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]"><Scissors size={60} /></div>
					)}
					{shop.isVerified && (
						<div className="absolute top-4 left-4 badge badge-gold"><Check size={10} /> {t("common.verified")}</div>
					)}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						<div>
							<div className="flex items-start justify-between gap-4 mb-2">
								<h1 className="text-3xl font-bold text-[var(--text)]">{shop.name}</h1>
								<div className="flex items-center gap-1.5 flex-shrink-0">
									<Star size={18} fill="currentColor" className="text-[var(--gold)]" />
									<span className="text-xl font-bold text-[var(--text)]">{shop.rating.toFixed(1)}</span>
									<span className="text-sm text-[var(--text-muted)]">({t("map.reviewsCount", { count: shop.reviewCount })})</span>
								</div>
							</div>
							<div className="flex items-center gap-1.5 text-[var(--text-muted)] mb-2">
								<MapPin size={15} /><span>{shop.address}, {shop.city}</span>
							</div>
							{shop.phone && (
								<div className="flex items-center gap-1.5 text-[var(--text-muted)]">
									<Phone size={15} />
									<a href={`tel:${shop.phone}`} className="hover:text-[var(--gold)] transition-colors no-underline">{shop.phone}</a>
								</div>
							)}
							{shop.description && <p className="mt-4 text-[var(--text-muted)] leading-relaxed">{shop.description}</p>}
						</div>

						{/* Services */}
						<div className="card p-5">
							<h2 className="text-lg font-bold text-[var(--text)] mb-4">{t("shop.services")}</h2>
							{!services ? (
								<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
							) : services.length === 0 ? (
								<p className="text-sm text-[var(--text-muted)]">{t("shop.noServices")}</p>
							) : (
								<div className="divide-y divide-[var(--border)]">
									{services.map((svc: Service) => (
										<div key={svc._id} className="flex items-center justify-between py-3">
											<div>
												<div className="font-medium text-[var(--text)] text-sm">{svc.name}</div>
												{svc.description && <div className="text-xs text-[var(--text-muted)]">{svc.description}</div>}
												<div className="text-xs text-[var(--text-subtle)] mt-0.5">{svc.durationMinutes} min</div>
											</div>
											<div className="text-sm font-bold text-[var(--gold)]">{formatPrice(svc.price)}</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Barbers */}
						<div className="card p-5">
							<h2 className="text-lg font-bold text-[var(--text)] mb-4">{t("shop.ourBarbers")}</h2>
							{!barbers ? (
								<div className="flex gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-20 rounded-full" />)}</div>
							) : barbers.length === 0 ? (
								<p className="text-sm text-[var(--text-muted)]">{t("shop.noBarbers")}</p>
							) : (
								<div className="flex flex-wrap gap-4">
									{barbers.map((b: Barber) => (
										<div key={b._id} className="flex flex-col items-center gap-2 text-center">
											<div className="w-16 h-16 rounded-full overflow-hidden bg-[var(--bg-card-hover)] flex items-center justify-center" style={{ border: "2px solid var(--border)" }}>
												{b.avatarUrl ? <img src={b.avatarUrl} alt={b.name} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-[var(--gold)]">{b.name.charAt(0)}</span>}
											</div>
											<div>
												<div className="text-sm font-semibold text-[var(--text)]">{b.name}</div>
												{b.specializations[0] && <div className="text-xs text-[var(--text-muted)]">{b.specializations[0]}</div>}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Reviews */}
						<div className="card p-5">
							<h2 className="text-lg font-bold text-[var(--text)] mb-4">{t("shop.reviewsTitle")}</h2>
							{!reviews ? (
								<div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
							) : reviews.length === 0 ? (
								<p className="text-sm text-[var(--text-muted)]">{t("shop.noReviews")}</p>
							) : (
								<div className="space-y-4">
									{reviews.map((r: Review) => (
										<div key={r._id} className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
											<div className="flex items-center gap-2 mb-2">
												<StarRating rating={r.rating} size={14} />
												<span className="text-xs text-[var(--text-muted)]">{formatRelative(r.createdAt)}</span>
											</div>
											<p className="text-sm text-[var(--text-muted)]">{r.comment}</p>
											{r.ownerReply && (
												<div className="mt-2 pl-3 border-l-2 border-[var(--gold)]/30">
													<p className="text-xs text-[var(--text-muted)]">
														<span className="text-[var(--gold)] font-semibold">{t("shop.ownerReply")}</span> {r.ownerReply}
													</p>
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Sidebar */}
					<div className="space-y-4">
						<div className="card p-5">
							<h3 className="font-bold text-[var(--text)] mb-3">{t("shop.bookAppointment")}</h3>
							<button type="button" onClick={() => setBookingOpen(true)} className="btn btn-primary w-full justify-center py-3 text-base">
								<Calendar size={18} /> {t("common.bookNow")}
							</button>
						</div>

						{shop.workingHours && (
							<div className="card p-5">
								<h3 className="font-bold text-[var(--text)] mb-3 flex items-center gap-2"><Clock size={16} /> {t("shop.hours")}</h3>
								<div className="space-y-1.5">
									{WEEK_DAYS.map((day: WeekDay) => {
										const h = shop.workingHours?.[day]
										return (
											<div key={day} className="flex justify-between text-sm">
												<span className="text-[var(--text-muted)]">{capitalizeFirst(day)}</span>
												<span className={h?.closed ? "text-[var(--error)]" : "text-[var(--text)]"}>
													{h?.closed ? t("shop.closed") : h ? `${h.open} – ${h.close}` : "–"}
												</span>
											</div>
										)
									})}
								</div>
							</div>
						)}

						{shop.socialLinks && (
							<div className="card p-5">
								<h3 className="font-bold text-[var(--text)] mb-3">{t("shop.followUs")}</h3>
								<div className="flex gap-2">
									{shop.socialLinks.instagram && (
										<a href={shop.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-[var(--bg-card-hover)] transition-colors"><Instagram size={18} /></a>
									)}
									{shop.socialLinks.facebook && (
										<a href={shop.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-[var(--bg-card-hover)] transition-colors"><Facebook size={18} /></a>
									)}
									{shop.socialLinks.website && (
										<a href={shop.socialLinks.website} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-[var(--bg-card-hover)] transition-colors"><Globe size={18} /></a>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			{bookingOpen && <BookingModal shop={shop} onClose={() => setBookingOpen(false)} />}
		</main>
	)
}

function ShopProfileSkeleton() {
	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-5xl space-y-6">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-72 w-full rounded-2xl" />
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-4">
						<Skeleton className="h-10 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-48 w-full rounded-2xl" />
					</div>
					<div><Skeleton className="h-40 w-full rounded-2xl" /></div>
				</div>
			</div>
		</main>
	)
}
