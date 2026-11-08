import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ArrowRight, ArrowUpRight, MapPin, Search } from "lucide-react"
import type { FormEvent } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import ShopCard from "#/components/ShopCard"
import { ShopCardSkeleton } from "#/components/ui/Skeleton"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
	const { t } = useTranslation()
	const [search, setSearch] = useState("")
	const [city, setCity] = useState("")
	const navigate = useNavigate()
	const featured = useQuery(api.barbershops.getFeatured, { limit: 6 })

	const handleSearch = (e: FormEvent) => {
		e.preventDefault()
		void navigate({
			to: "/barbershops/listing",
			search: { q: search || undefined, city: city || undefined },
		})
	}

	return (
		<main className="bg-(--bg)">
			{/* Hero */}
			<section className="border-b border-(--border)">
				<div className="page-wrap px-5 md:px-8 pt-10 md:pt-16 pb-12 md:pb-20">
					<div className="grid items-end gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
						<div className="pb-1">
							<p className="eyebrow fade-up">{t("home.heroEyebrow")}</p>
							<h1 className="display display-lg mt-6 text-(--text) fade-up [animation-delay:60ms]">
								{t("home.heroTitle")}
								<br />
								<span className="italic text-(--gold)">{t("home.heroTitleHighlight")}.</span>
							</h1>
							<p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-(--text-muted) fade-up [animation-delay:120ms]">
								{t("home.heroSubtitle")}
							</p>

							<form
								onSubmit={handleSearch}
								className="mt-9 max-w-xl rounded-(--radius-lg) border border-(--border) bg-(--bg-card) p-2 shadow-[var(--shadow-xs)] fade-up [animation-delay:180ms]"
							>
								<div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
									<div className="flex flex-1 items-center gap-2.5 rounded-(--radius) px-3 py-2 transition-colors focus-within:bg-(--bg-input)/60">
										<Search size={16} className="shrink-0 text-(--text-subtle)" />
										<div className="min-w-0 flex-1">
											<label
												htmlFor="home-search"
												className="block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-(--text-subtle)"
											>
												{t("home.searchLabel")}
											</label>
											<input
												id="home-search"
												type="text"
												placeholder={t("home.searchPlaceholder")}
												value={search}
												onChange={(e) => setSearch(e.target.value)}
												className="w-full border-none bg-transparent p-0 text-sm text-(--text) outline-none placeholder:text-(--text-subtle)"
											/>
										</div>
									</div>

									<div className="hidden w-px self-stretch bg-(--border) sm:block" />

									<div className="flex flex-1 items-center gap-2.5 rounded-(--radius) px-3 py-2 transition-colors focus-within:bg-(--bg-input)/60">
										<MapPin size={16} className="shrink-0 text-(--text-subtle)" />
										<div className="min-w-0 flex-1">
											<label
												htmlFor="home-city"
												className="block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-(--text-subtle)"
											>
												{t("home.cityLabel")}
											</label>
											<input
												id="home-city"
												type="text"
												placeholder={t("home.cityPlaceholder")}
												value={city}
												onChange={(e) => setCity(e.target.value)}
												className="w-full border-none bg-transparent p-0 text-sm text-(--text) outline-none placeholder:text-(--text-subtle)"
											/>
										</div>
									</div>

									<button type="submit" className="btn btn-primary sm:px-5">
										{t("common.search")}
										<ArrowRight size={15} />
									</button>
								</div>
							</form>

							<p className="mt-4 flex max-w-md items-start gap-2.5 text-[0.8rem] leading-relaxed text-(--text-subtle)">
								<span className="mt-2 block h-px w-5 shrink-0 bg-(--gold)" />
								{t("home.heroNote")}
							</p>
						</div>

						<div className="relative fade-up [animation-delay:120ms]">
							<div className="image-frame aspect-[4/5] max-h-[560px] w-full">
								<img
									src="/images/hero-barbershop.jpg"
									alt={t("home.heroImageAlt")}
									className="h-full w-full object-cover"
									loading="eager"
								/>
								<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
								<div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-(--radius) border border-white/25 bg-black/25 px-4 py-3 backdrop-blur-md">
									<p className="font-serif text-[1.15rem] leading-tight text-white">
										{t("home.heroCaption")}
									</p>
									<span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
										FadeIn
									</span>
								</div>
							</div>
							<div className="absolute -left-2 top-6 hidden h-16 w-px bg-(--gold) lg:block" />
						</div>
					</div>
				</div>
			</section>

			{/* Featured */}
			<section className="border-b border-(--border)">
				<div className="page-wrap px-5 md:px-8 py-14 md:py-20">
					<div className="mb-9 flex flex-wrap items-end justify-between gap-5">
						<div>
							<p className="eyebrow">{t("home.featuredEyebrow")}</p>
							<h2 className="display display-sm mt-3">{t("home.featured")}</h2>
							<p className="mt-2 max-w-md text-sm text-(--text-muted)">{t("home.featuredSubtitle")}</p>
						</div>
						<Link
							to="/barbershops/listing"
							className="group hidden items-center gap-2 text-[13px] font-semibold text-(--text) sm:inline-flex"
						>
							{t("common.viewAll")}
							<ArrowUpRight
								size={15}
								className="text-(--gold) transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
							/>
						</Link>
					</div>

					{!featured ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{[0, 1, 2, 3, 4, 5].map((i) => (
								<ShopCardSkeleton key={i} />
							))}
						</div>
					) : featured.length === 0 ? (
						<div className="grid overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--bg-card) md:grid-cols-[0.85fr_1.15fr]">
							<div className="relative min-h-[260px] md:min-h-[340px]">
								<img
									src="/images/shop-barbershop.jpg"
									alt=""
									className="absolute inset-0 h-full w-full object-cover"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
							</div>
							<div className="flex flex-col justify-center p-8 md:p-12">
								<p className="eyebrow">{t("home.ownersEyebrow")}</p>
								<h3 className="display mt-4 max-w-sm text-[1.9rem] leading-[1.12]">
									{t("home.noFeatured")}
								</h3>
								<p className="mt-4 max-w-sm text-sm leading-relaxed text-(--text-muted)">
									{t("home.emptyFeaturedHint")}
								</p>
								<Link to="/for-business" className="btn btn-primary mt-6 self-start">
									{t("home.listYourShop")}
									<ArrowRight size={15} />
								</Link>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{featured.map((shop: Doc<"barbershops">) => (
								<ShopCard key={shop._id} shop={shop} />
							))}
						</div>
					)}
				</div>
			</section>

			{/* How it works */}
			<section className="border-b border-(--border)">
				<div className="page-wrap px-5 md:px-8 py-14 md:py-20">
					<div className="mb-10 max-w-xl">
						<p className="eyebrow">{t("home.howEyebrow")}</p>
						<h2 className="display display-sm mt-3">{t("home.howTitle")}</h2>
						<p className="mt-2 text-sm text-(--text-muted)">{t("home.howSubtitle")}</p>
					</div>

					<div className="grid gap-px overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--border) sm:grid-cols-3">
						{[
							{ step: "01", key: "discover" },
							{ step: "02", key: "book" },
							{ step: "03", key: "enjoy" },
						].map(({ step, key }) => (
							<div key={step} className="bg-(--bg-card) p-7 md:p-9">
								<span className="font-serif text-[1.6rem] font-medium italic leading-none text-(--gold)">
									{step}
								</span>
								<h3 className="mt-6 font-serif text-[1.35rem] font-medium tracking-[-0.02em] text-(--text)">
									{t(`home.steps.${key}.title`)}
								</h3>
								<p className="mt-2 text-[0.84rem] leading-relaxed text-(--text-muted)">
									{t(`home.steps.${key}.desc`)}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Owner CTA */}
			<section>
				<div className="page-wrap px-5 md:px-8 py-14 md:py-20">
					<div className="grid overflow-hidden rounded-(--radius-lg) bg-(--ink) text-(--bg) md:grid-cols-[1.05fr_0.95fr]">
						<div className="flex flex-col justify-center p-8 md:p-14">
							<p className="eyebrow text-[#f7f4ee]/70 before:bg-(--gold-light)">
								{t("home.ownersEyebrow")}
							</p>
							<h2 className="display display-sm mt-4 max-w-md text-[#f7f4ee]">{t("home.ctaTitle")}</h2>
							<p className="mt-4 max-w-sm text-sm leading-relaxed text-[#f7f4ee]/65">
								{t("home.ctaSubtitle")}
							</p>
							<Link to="/for-business" className="btn btn-primary mt-7 self-start">
								{t("common.getStarted")}
								<ArrowRight size={15} />
							</Link>
						</div>
						<div className="relative min-h-[260px] md:min-h-[360px]">
							<img
								src="/images/for-business.jpg"
								alt={t("forBusiness.imageAlt")}
								className="absolute inset-0 h-full w-full object-cover"
							/>
							<div className="absolute inset-0 bg-gradient-to-r from-[#191512] via-[#191512]/25 to-transparent md:from-[#191512]/70" />
						</div>
					</div>
				</div>
			</section>
		</main>
	)
}
