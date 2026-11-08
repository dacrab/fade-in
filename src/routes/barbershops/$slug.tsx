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
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import BookingModal from "#/components/BookingModal"
import { Skeleton } from "#/components/ui/Skeleton"
import { StarRating } from "#/components/ui/StarRating"
import { withToast } from "#/components/ui/Toast"
import { useFormatters } from "#/hooks/useFormatters"
import { formatPrice } from "#/lib/format"
import type { Barber, Review, Service, WeekDay } from "#/types"
import { PAGE_SIZE, WEEK_DAYS } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/barbershops/$slug")({ component: ShopProfilePage })

const DAY_INDEX: Record<number, WeekDay> = {
	0: "sunday",
	1: "monday",
	2: "tuesday",
	3: "wednesday",
	4: "thursday",
	5: "friday",
	6: "saturday",
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: large linear JSX view component
function ShopProfilePage() {
	const { t } = useTranslation()
	const f = useFormatters()
	const { slug } = Route.useParams()
	const shop = useQuery(api.barbershops.getBySlug, { slug })
	const [bookingOpen, setBookingOpen] = useState(false)
	const [showQr, setShowQr] = useState(false)
	const [bookingUrl, setBookingUrl] = useState("")
	const today = DAY_INDEX[new Date().getDay()]

	useEffect(() => {
		// Computed after mount: window.location is unavailable during SSR.
		setBookingUrl(`${window.location.origin}/barbershops/${slug}`)
	}, [slug])

	const handleCopyLink = () =>
		withToast(
			() => navigator.clipboard.writeText(bookingUrl),
			t("shop.linkCopied"),
			t("shop.linkCopyFailed"),
		)
	const services = useQuery(api.services.listByShop, shop ? { barbershopId: shop._id } : "skip")
	const barbers = useQuery(api.barbers.listByShop, shop ? { barbershopId: shop._id } : "skip")
	const reviewsResult = useQuery(
		api.reviews.listByShop,
		shop ? { barbershopId: shop._id, paginationOpts: { cursor: null, numItems: PAGE_SIZE } } : "skip",
	)
	const reviews = reviewsResult?.page

	if (shop === undefined) return <ShopProfileSkeleton />
	if (!shop)
		return (
			<main className="flex flex-1 items-center justify-center px-4">
				<div className="text-center">
					<span className="font-serif text-7xl font-medium italic text-(--gold)/30">404</span>
					<h1 className="page-title mb-2 mt-3">{t("shop.notFound")}</h1>
					<Link to="/barbershops/listing" className="btn btn-primary mt-5">
						{t("shop.notFoundHint")}
					</Link>
				</div>
			</main>
		)

	return (
		<main className="pb-16">
			<div className="page-container !pt-6">
				<Link
					to="/barbershops/listing"
					className="inline-flex items-center gap-1.5 text-[12px] font-medium text-(--text-muted) transition-colors hover:text-(--gold)"
				>
					<ChevronLeft size={14} /> {t("shop.back")}
				</Link>

				<div className="mt-6 flex flex-wrap items-start justify-between gap-6 border-b border-(--border) pb-7">
					<div className="min-w-0">
						<div className="mb-3 flex flex-wrap items-center gap-2.5">
							<span className="inline-flex items-center gap-1 text-[12px] font-semibold text-(--text)">
								<Star size={13} fill="currentColor" className="text-(--gold)" />
								{shop.rating.toFixed(1)}
								<span className="font-normal text-(--text-subtle)">
									({t("map.reviewsCount", { count: shop.reviewCount })})
								</span>
							</span>
							{shop.isVerified && (
								<span className="inline-flex items-center gap-1 rounded-(--radius-sm) border border-(--gold)/20 bg-(--gold)/8 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-(--gold)">
									<Check size={10} strokeWidth={2.5} />
									{t("common.verified")}
								</span>
							)}
						</div>

						<h1 className="display text-[clamp(2.5rem,5.5vw,4.25rem)] text-(--text)">{shop.name}</h1>

						<div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-(--text-muted)">
							<span className="flex items-center gap-1.5">
								<MapPin size={13} className="text-(--text-subtle)" />
								{shop.address}, {shop.city}
							</span>
							{shop.phone && (
								<a
									href={`tel:${shop.phone}`}
									className="flex items-center gap-1.5 transition-colors hover:text-(--gold)"
								>
									<Phone size={13} className="text-(--text-subtle)" />
									{shop.phone}
								</a>
							)}
						</div>
					</div>

					<button
						type="button"
						onClick={() => setBookingOpen(true)}
						className="btn btn-primary btn-lg shrink-0"
					>
						<Calendar size={16} /> {t("common.bookNow")}
					</button>
				</div>

				<div className="image-frame mt-7 aspect-[16/7] max-h-[420px] w-full">
					{shop.images[0] ? (
						<img src={shop.images[0]} alt={shop.name} className="h-full w-full object-cover" />
					) : (
						<div className="flex h-full w-full items-center justify-center bg-[#efe5d8]">
							<Scissors size={56} className="text-(--gold)/25" />
						</div>
					)}
				</div>

				<div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_0.9fr] lg:gap-14">
					<div className="space-y-12">
						<div>
							<p className="eyebrow">{t("shop.about")}</p>
							{shop.description && (
								<p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-(--text-muted)">
									{shop.description}
								</p>
							)}
						</div>

						<section>
							<div className="mb-5 flex items-baseline justify-between gap-4">
								<h2 className="display text-[1.9rem] text-(--text)">{t("shop.services")}</h2>
								{services && services.length > 0 && (
									<span className="text-[11px] font-medium uppercase tracking-[0.1em] text-(--text-subtle)">
										{services.length}
									</span>
								)}
							</div>
							{!services ? (
								<div className="space-y-3">
									{[0, 1, 2].map((i) => (
										<Skeleton key={i} className="h-16 w-full rounded-(--radius)" />
									))}
								</div>
							) : services.length === 0 ? (
								<p className="muted-sm">{t("shop.noServices")}</p>
							) : (
								<div className="divide-y divide-(--border) rounded-(--radius-lg) border border-(--border) bg-(--bg-card)">
									{services.map((svc: Service) => (
										<div
											key={svc._id}
											className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-(--bg-input)/40"
										>
											<div className="min-w-0 flex-1">
												<div className="text-[14px] font-semibold text-(--text) transition-colors group-hover:text-(--gold)">
													{svc.name}
												</div>
												{svc.description && (
													<div className="mt-0.5 text-xs leading-relaxed text-(--text-muted)">
														{svc.description}
													</div>
												)}
											</div>
											<div className="flex shrink-0 items-center gap-5">
												<span className="text-[11px] text-(--text-subtle)">
													{svc.durationMinutes} {t("common.min")}
												</span>
												<span className="min-w-16 text-right text-sm font-semibold tabular-nums text-(--text)">
													{formatPrice(svc.price)}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						<section>
							<h2 className="display mb-5 text-[1.9rem] text-(--text)">{t("shop.ourBarbers")}</h2>
							{!barbers ? (
								<div className="flex gap-4">
									{[0, 1, 2].map((i) => (
										<Skeleton key={i} className="h-40 w-36 flex-shrink-0 rounded-(--radius-lg)" />
									))}
								</div>
							) : barbers.length === 0 ? (
								<p className="muted-sm">{t("shop.noBarbers")}</p>
							) : (
								<div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
									{barbers.map((b: Barber) => (
										<div
											key={b._id}
											className="flex w-36 flex-shrink-0 flex-col items-center gap-3 rounded-(--radius-lg) border border-(--border) bg-(--bg-card) px-4 py-5 text-center transition-colors hover:border-(--border-hover)"
										>
											<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#efe5d8] ring-1 ring-(--gold)/20">
												{b.avatarUrl ? (
													<img src={b.avatarUrl} alt={b.name} className="h-full w-full object-cover" />
												) : (
													<span className="font-serif text-2xl font-medium text-(--gold)">
														{b.name.charAt(0)}
													</span>
												)}
											</div>
											<div>
												<div className="text-[13px] font-semibold text-(--text)">{b.name}</div>
												{b.specializations[0] && (
													<div className="mt-0.5 text-[10.5px] text-(--text-subtle)">{b.specializations[0]}</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						<section>
							<div className="mb-6 flex items-baseline gap-4">
								<h2 className="display text-[1.9rem] text-(--text)">{t("shop.reviewsTitle")}</h2>
								{reviews && reviews.length > 0 && (
									<span className="font-serif text-2xl italic text-(--gold)">{shop.rating.toFixed(1)}</span>
								)}
							</div>
							{!reviews ? (
								<div className="space-y-4">
									{[0, 1, 2].map((i) => (
										<Skeleton key={i} className="h-24 w-full rounded-(--radius)" />
									))}
								</div>
							) : reviews.length === 0 ? (
								<p className="muted-sm">{t("shop.noReviews")}</p>
							) : (
								<div className="divide-y divide-(--border)">
									{reviews.map((r: Review) => (
										<div key={r._id} className="py-5 first:pt-0 last:pb-0">
											<div className="mb-2 flex items-center gap-3">
												<StarRating rating={r.rating} size={12} />
												<span className="text-[10.5px] uppercase tracking-[0.08em] text-(--text-subtle)">
													{f.formatRelative(r.createdAt)}
												</span>
											</div>
											<p className="text-[13.5px] leading-relaxed text-(--text)">{r.comment}</p>
											{r.ownerReply && (
												<div className="mt-3 border-l-2 border-(--gold)/30 pl-4">
													<p className="text-xs leading-relaxed text-(--text-muted)">
														<span className="font-semibold text-(--gold)">{t("shop.ownerReply")}</span>{" "}
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

					<div>
						<div className="lg:sticky lg:top-24">
							<div className="rounded-(--radius-lg) bg-(--ink) p-6 text-[#f7f4ee]">
								<p className="eyebrow text-[#f7f4ee]/50 before:bg-(--gold-light)">
									{t("shop.bookEyebrow")}
								</p>
								<h3 className="mt-3 font-serif text-2xl font-medium tracking-[-0.02em]">
									{t("shop.bookAppointment")}
								</h3>
								<div className="mt-4 flex items-center gap-2 text-[12px] text-[#f7f4ee]/60">
									<Star size={13} fill="currentColor" className="text-[#f3c67c]" />
									<span className="font-semibold text-[#f7f4ee]">{shop.rating.toFixed(1)}</span>
									<span>·</span>
									<span>{t("map.reviewsCount", { count: shop.reviewCount })}</span>
								</div>
								<button
									type="button"
									onClick={() => setBookingOpen(true)}
									className="btn btn-primary mt-5 w-full"
								>
									<Calendar size={15} /> {t("common.bookNow")}
								</button>
							</div>

							{shop.workingHours && (
								<div className="mt-4 rounded-(--radius-lg) border border-(--border) bg-(--bg-card) p-5">
									<h3 className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-(--text-muted)">
										<Clock size={13} className="text-(--gold)" /> {t("shop.hours")}
									</h3>
									<div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
										{WEEK_DAYS.map((day: WeekDay) => {
											const h = shop.workingHours?.[day]
											const isToday = day === today
											return (
												<div key={day} className="contents">
													<span
														className={`flex items-center gap-1.5 text-xs ${
															isToday ? "font-semibold text-(--text)" : "text-(--text-muted)"
														}`}
													>
														{isToday && <span className="h-1 w-1 rounded-full bg-(--gold)" />}
														{t(`days.${day}`)}
													</span>
													<span
														className={`text-right text-xs tabular-nums ${
															h?.closed
																? "text-(--error)"
																: isToday
																	? "font-semibold text-(--text)"
																	: "text-(--text)"
														}`}
													>
														{h?.closed ? t("shop.closed") : h ? `${h.open}–${h.close}` : "–"}
													</span>
												</div>
											)
										})}
									</div>
								</div>
							)}

							<div className="mt-4 rounded-(--radius-lg) border border-(--border) bg-(--bg-card) p-5">
								<div className="mb-3 flex items-center gap-2">
									<Share2 size={13} className="text-(--text-subtle)" />
									<span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-(--text-muted)">
										{t("shop.shareTitle")}
									</span>
								</div>
								<div className="mb-2 flex gap-2">
									<input
										readOnly
										value={bookingUrl}
										className="min-w-0 flex-1 rounded-(--radius) border border-(--border) bg-(--bg) px-3 py-2 text-[11px] text-(--text-muted) outline-none"
									/>
									<button
										type="button"
										onClick={() => void handleCopyLink()}
										className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-(--radius) border border-(--border) text-(--text-muted) transition-colors hover:border-(--gold)/40 hover:text-(--gold)"
										title={t("shop.copyLink")}
									>
										<Copy size={13} />
									</button>
								</div>
								<button
									type="button"
									onClick={() => setShowQr((v) => !v)}
									className="flex w-full items-center justify-center gap-1.5 py-2 text-[11px] text-(--text-subtle) transition-colors hover:text-(--gold)"
								>
									<QrCode size={12} /> {showQr ? t("shop.hideQr") : t("shop.showQr")}
								</button>
								{showQr && (
									<div className="mt-3 flex justify-center rounded-(--radius) bg-white p-4">
										<QRCodeSVG value={bookingUrl} size={140} />
									</div>
								)}
							</div>

							{shop.socialLinks && (
								<div className="mt-4 flex items-center gap-2 px-1">
									{(
										[
											["instagram", shop.socialLinks.instagram, Link2],
											["facebook", shop.socialLinks.facebook, Share2],
											["website", shop.socialLinks.website, Globe],
										] as const
									).map(([label, url, Icon]) =>
										url ? (
											<a
												key={label}
												href={url}
												target="_blank"
												rel="noreferrer"
												className="flex h-9 w-9 items-center justify-center rounded-(--radius) border border-(--border) bg-(--bg-card) text-(--text-muted) transition-colors hover:border-(--gold)/40 hover:text-(--gold)"
											>
												<Icon size={15} />
											</a>
										) : null,
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
		<main className="pb-16">
			<div className="page-container !pt-6">
				<Skeleton className="h-4 w-40" />
				<div className="mt-6 flex items-end justify-between gap-6 border-b border-(--border) pb-7">
					<div className="space-y-4">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-12 w-72 max-w-full" />
						<Skeleton className="h-4 w-56" />
					</div>
					<Skeleton className="h-10 w-32" />
				</div>
				<Skeleton className="mt-7 aspect-[16/7] max-h-[420px] w-full rounded-(--radius-lg)" />
				<div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_0.9fr]">
					<div className="space-y-4">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-48 w-full rounded-(--radius-lg)" />
					</div>
					<Skeleton className="h-56 w-full rounded-(--radius-lg)" />
				</div>
			</div>
		</main>
	)
}
