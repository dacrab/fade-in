import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ChevronRight, MapPin, Scissors, Search } from "lucide-react"
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
	const stats = useQuery(api.barbershops.getStats, {})

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		void navigate({
			to: "/barbershops/listing",
			search: { q: search || undefined, city: city || undefined },
		})
	}

	return (
		<main className="bg-(--bg)">
			{/* Hero */}
			<section className="relative px-4 pt-16 pb-10">
				{/* Subtle pattern */}
				<div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')]" />
				<div className="page-wrap relative max-w-3xl">
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-(--text) mb-4 font-serif">
						{t("home.heroTitle")} <span className="text-(--gold)">{t("home.heroTitleHighlight")}</span>
					</h1>
					<p className="text-lg text-(--text-muted) mb-10 max-w-lg leading-relaxed">
						{t("home.heroSubtitle")}
					</p>

					{/* Search form */}
					<form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl mb-6">
						<div className="flex-1 relative">
							<Search
								size={15}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-subtle)"
							/>
							<input
								type="text"
								placeholder={t("home.searchPlaceholder")}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="input !pl-9"
							/>
						</div>
						<div className="flex-1 relative">
							<MapPin
								size={15}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-subtle)"
							/>
							<input
								type="text"
								placeholder={t("home.cityPlaceholder")}
								value={city}
								onChange={(e) => setCity(e.target.value)}
								className="input !pl-9"
							/>
						</div>
						<button type="submit" className="btn btn-primary whitespace-nowrap">
							{t("common.search")}
						</button>
					</form>

					{stats && (stats.shopCount > 0 || stats.customerCount > 0) && (
						<div className="flex items-center gap-6 text-sm text-(--text-muted) mt-8">
							{stats.shopCount > 0 && (
								<span>
									<strong className="text-(--text)">{stats.shopCount}</strong> {t("home.stats.shops")}
								</span>
							)}
							{stats.customerCount > 0 && (
								<span>
									<strong className="text-(--text)">{stats.customerCount}</strong> {t("home.stats.clients")}
								</span>
							)}
							{stats.avgRating > 0 && (
								<span>
									<strong className="text-(--text)">{stats.avgRating}</strong> {t("home.stats.rating")}
								</span>
							)}
						</div>
					)}
				</div>
			</section>

			{/* Featured */}
			<section className="px-4 py-8">
				<div className="page-wrap">
					<h2 className="text-2xl font-bold text-(--text) mb-5">{t("home.featured")}</h2>
					{!featured ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{Array.from({ length: 6 }, (_, i) => (
								<ShopCardSkeleton
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no id
									key={i}
								/>
							))}
						</div>
					) : featured.length === 0 ? (
						<div className="py-8 text-(--text-muted)">
							<Scissors size={40} className="mb-4 opacity-30" />
							<p>{t("home.noFeatured")}</p>
							<Link to="/for-business" className="btn btn-primary mt-4 inline-flex">
								{t("nav.forBusiness")}
							</Link>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{featured.map((shop: Doc<"barbershops">) => (
								<ShopCard key={shop._id} shop={shop as Barbershop} />
							))}
						</div>
					)}
				</div>
			</section>

			{/* How it works */}
			<section className="px-4 py-8 border-t border-(--border)">
				<div className="page-wrap">
					<h2 className="text-2xl font-bold text-(--text) mb-2">{t("home.howTitle")}</h2>
					<p className="text-(--text-muted) mb-6">{t("home.howSubtitle")}</p>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
						{[
							{ step: "1", key: "discover" },
							{ step: "2", key: "book" },
							{ step: "3", key: "enjoy" },
						].map(({ step, key }) => (
							<div key={step}>
								<span className="text-3xl font-bold text-(--gold) mb-2 block">{step}.</span>
								<h3 className="text-lg font-semibold text-(--text) mb-1">{t(`home.steps.${key}.title`)}</h3>
								<p className="text-(--text-muted) leading-relaxed">{t(`home.steps.${key}.desc`)}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="px-4 py-8">
				<div className="page-wrap">
					<div className="bg-(--gold)/5 border border-(--gold)/10 rounded-xl px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
						<div>
							<h2 className="text-2xl sm:text-3xl font-bold text-(--text) mb-1">{t("home.ctaTitle")}</h2>
							<p className="text-(--text-muted)">{t("home.ctaSubtitle")}</p>
						</div>
						<Link
							to="/for-business"
							className="shrink-0 px-8 py-3.5 bg-(--gold) hover:bg-(--gold-dark) transition-colors text-white font-semibold rounded-lg inline-flex items-center gap-2"
						>
							{t("common.getStarted")} <ChevronRight size={16} />
						</Link>
					</div>
				</div>
			</section>
		</main>
	)
}
