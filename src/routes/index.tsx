import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ArrowRight, ChevronRight, Scissors, Search, Star } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import ShopCard from "#/components/ShopCard"
import { ShopCardSkeleton } from "#/components/ui/Skeleton"
import type { Barbershop } from "#/types"
import { api } from "../../convex/_generated/api"
import type { Doc } from "../../convex/_generated/dataModel"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
	const { t } = useTranslation()
	const [search, setSearch] = useState("")
	const [city, setCity] = useState("")
	const navigate = useNavigate()
	const featured = useQuery(api.barbershops.getFeatured, { limit: 6 })

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		void navigate({ to: "/barbershops", search: { q: search || undefined, city: city || undefined } })
	}

	return (
		<main>
			{/* Hero */}
			<section className="relative overflow-hidden px-4 pt-20 pb-24 bg-[linear-gradient(180deg,#0A0A0A_0%,#111_100%)]">
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-[500px] w-[500px] rounded-full opacity-10 bg-[radial-gradient(circle,var(--gold)_0%,transparent_70%)]" />
				</div>
				<div className="page-wrap relative text-center">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/5 text-[var(--gold)] text-xs font-semibold mb-6 fade-up">
						<Scissors size={12} />
						{t("home.badge")}
					</div>
					<h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 fade-up [animation-delay:60ms]">
						{t("home.heroTitle")} <span className="gold-text">{t("home.heroTitleHighlight")}</span>
					</h1>
					<p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-xl mx-auto mb-10 fade-up [animation-delay:120ms]">
						{t("home.heroSubtitle")}
					</p>
					<form
						onSubmit={handleSearch}
						className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto fade-up [animation-delay:180ms]"
					>
						<div className="flex-1 relative">
							<Search
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
							/>
							<input
								className="input pl-9"
								placeholder={t("home.searchPlaceholder")}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div className="relative sm:w-48">
							<MapPin
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
							/>
							<input
								className="input pl-9"
								placeholder={t("home.cityPlaceholder")}
								value={city}
								onChange={(e) => setCity(e.target.value)}
							/>
						</div>
						<button type="submit" className="btn btn-primary whitespace-nowrap">
							<Search size={15} />
							{t("common.search")}
						</button>
					</form>
					<div className="flex flex-wrap justify-center gap-8 mt-14 fade-up [animation-delay:240ms]">
						{(
							[
								["500+", t("home.stats.shops")],
								["50k+", t("home.stats.clients")],
								["4.9", t("home.stats.rating")],
							] as [string, string][]
						).map(([val, label]) => (
							<div key={label} className="text-center">
								<div className="text-2xl font-bold gold-text">{val}</div>
								<div className="text-sm text-[var(--text-muted)]">{label}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Featured */}
			<section className="px-4 py-16">
				<div className="page-wrap">
					<div className="section-header">
						<div>
							<h2 className="text-2xl font-bold text-[var(--text)] mb-1">{t("home.featured")}</h2>
							<p className="text-[var(--text-muted)] text-sm">{t("home.featuredSubtitle")}</p>
						</div>
						<Link to="/barbershops" className="section-link flex items-center gap-1">
							{t("common.viewAll")} <ArrowRight size={14} />
						</Link>
					</div>
					{featured === undefined ? (
						<div className="shop-grid">
							{Array.from({ length: 6 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
								<ShopCardSkeleton key={i} />
							))}
						</div>
					) : featured.length === 0 ? (
						<div className="text-center py-16 text-[var(--text-muted)]">
							<Scissors size={40} className="mx-auto mb-4 opacity-30" />
							<p>{t("home.noFeatured")}</p>
							<Link to="/for-business" className="btn btn-primary mt-4 inline-flex">
								{t("nav.forBusiness")}
							</Link>
						</div>
					) : (
						<div className="shop-grid">
							{featured.map((shop: Doc<"barbershops">) => (
								<ShopCard key={shop._id} shop={shop as unknown as Barbershop} />
							))}
						</div>
					)}
				</div>
			</section>

			{/* How it works */}
			<section className="px-4 py-16 border-t border-[var(--border)]">
				<div className="page-wrap">
					<div className="text-center mb-12">
						<h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t("home.howTitle")}</h2>
						<p className="text-[var(--text-muted)]">{t("home.howSubtitle")}</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
						{(
							[
								{ icon: Search, step: "01", key: "discover" },
								{ icon: Star, step: "02", key: "book" },
								{ icon: Scissors, step: "03", key: "enjoy" },
							] as const
						).map(({ icon: Icon, step, key }) => (
							<div key={step} className="text-center">
								<div
									className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-[var(--gold)]"
									style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
								>
									<Icon size={24} />
								</div>
								<div className="text-xs text-[var(--gold)] font-bold mb-1">{step}</div>
								<h3 className="font-bold text-[var(--text)] mb-2">{t(`home.steps.${key}.title`)}</h3>
								<p className="text-sm text-[var(--text-muted)]">{t(`home.steps.${key}.desc`)}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="px-4 py-16">
				<div className="page-wrap">
					<div
						className="rounded-2xl p-10 text-center"
						style={{
							background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.04) 100%)",
							border: "1px solid rgba(245,158,11,0.15)",
						}}
					>
						<h2 className="text-3xl font-bold text-[var(--text)] mb-3">{t("home.ctaTitle")}</h2>
						<p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">{t("home.ctaSubtitle")}</p>
						<Link to="/for-business" className="btn btn-primary inline-flex text-base px-8 py-3">
							{t("common.getStarted")} <ChevronRight size={16} />
						</Link>
					</div>
				</div>
			</section>
		</main>
	)
}

