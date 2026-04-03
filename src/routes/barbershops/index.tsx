import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Search, MapPin, Star, Map, List, Scissors, Filter, X, Check } from "lucide-react"
import { ShopCardSkeleton } from "../../components/ui/Skeleton"
import { Slider } from "../../components/ui/Slider"
import MapView from "../../components/MapView"
import type { Barbershop } from "../../types"
import { z } from "zod"

const searchSchema = z.object({
	q: z.string().optional(),
	city: z.string().optional(),
	minRating: z.coerce.number().optional(),
})

export const Route = createFileRoute("/barbershops/")({
	validateSearch: searchSchema,
	component: BarbershopsPage,
})

function BarbershopsPage() {
	const { t } = useTranslation()
	const { q, city: cityParam, minRating: minRatingParam } = Route.useSearch()
	const navigate = useNavigate()
	const [search, setSearch] = useState(q ?? "")
	const [city, setCity] = useState(cityParam ?? "")
	const [minRating, setMinRating] = useState(minRatingParam ?? 0)
	const [view, setView] = useState<"list" | "map">("list")
	const [showFilters, setShowFilters] = useState(false)

	const shops = useQuery(api.barbershops.list, {
		city: city || undefined,
		search: search || undefined,
		minRating: minRating > 0 ? minRating : undefined,
	}) as Barbershop[] | undefined

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		void navigate({ to: "/barbershops", search: { q: search || undefined, city: city || undefined, minRating: minRating > 0 ? minRating : undefined } })
	}

	return (
		<main className="page-main">
			<div className="page-wrap">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-[var(--text)] mb-1">{t("barbershops.title")}</h1>
					<p className="text-[var(--text-muted)] text-sm">
						{shops === undefined ? t("common.loading") : t("barbershops.found", { count: shops.length })}
					</p>
				</div>

				<form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
					<div className="flex-1 relative">
						<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
						<input className="input pl-9" placeholder={t("barbershops.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
					</div>
					<div className="relative sm:w-44">
						<MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
						<input className="input pl-9" placeholder={t("home.cityPlaceholder")} value={city} onChange={(e) => setCity(e.target.value)} />
					</div>
					<button type="submit" className="btn btn-primary gap-2 whitespace-nowrap">
						<Search size={15} />{t("common.search")}
					</button>
					<button type="button" onClick={() => setShowFilters(!showFilters)}
						className={`btn btn-secondary gap-2 ${showFilters ? "border-[var(--gold)]/50 text-[var(--gold)]" : ""}`}>
						<Filter size={15} />{t("common.filter")}
						{minRating > 0 && <span className="badge badge-gold py-0 px-1.5 text-[10px]">{minRating}+</span>}
					</button>
					<div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
						{(["list", "map"] as const).map((v) => (
							<button key={v} type="button" onClick={() => setView(v)}
								className="px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors"
								style={{ background: view === v ? "var(--gold)" : "var(--bg-card)", color: view === v ? "#000" : "var(--text-muted)", border: "none", cursor: "pointer" }}>
								{v === "list" ? <List size={14} /> : <Map size={14} />}
								<span className="hidden sm:inline">{v === "list" ? t("barbershops.listView") : t("barbershops.mapView")}</span>
							</button>
						))}
					</div>
				</form>

				{showFilters && (
					<div className="card p-5 mb-5 fade-up">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-sm font-semibold text-[var(--text)]">{t("common.filter")}</h3>
							{minRating > 0 && (
								<button type="button" onClick={() => setMinRating(0)}
									className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
									style={{ background: "none", border: "none", cursor: "pointer" }}>
									<X size={12} />{t("common.reset")}
								</button>
							)}
						</div>
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="text-xs font-medium text-[var(--text-muted)]">{t("barbershops.minRating")}</label>
								<span className="text-sm font-bold text-[var(--gold)]">
									{minRating === 0 ? t("common.anyRating") : t("barbershops.ratingAbove", { rating: minRating })}
								</span>
							</div>
							<Slider value={[minRating]} onValueChange={([v]) => setMinRating(v ?? 0)} min={0} max={5} step={0.5} />
							<div className="flex justify-between text-xs text-[var(--text-subtle)] mt-1">
								<span>{t("common.anyRating")}</span><span>5</span>
							</div>
						</div>
					</div>
				)}

				{view === "map" ? (
					<MapView shops={shops ?? []} onShopClick={(slug) => void navigate({ to: "/barbershops/$slug", params: { slug } })} />
				) : shops === undefined ? (
					<div className="shop-grid">
						{Array.from({ length: 6 }).map((_, i) => <ShopCardSkeleton key={i} />)}
					</div>
				) : shops.length === 0 ? (
					<div className="empty-state">
						<Scissors size={40} className="mx-auto mb-4 opacity-30" />
						<p className="text-lg font-semibold text-[var(--text)] mb-1">{t("barbershops.noShops")}</p>
						<p className="text-sm mb-4">{t("barbershops.noShopsHint")}</p>
						{(search || city || minRating > 0) && (
							<button type="button" onClick={() => { setSearch(""); setCity(""); setMinRating(0) }} className="btn btn-secondary text-sm">
								{t("barbershops.clearFilters")}
							</button>
						)}
					</div>
				) : (
					<div className="shop-grid">
						{shops.map((shop) => <ShopCard key={shop._id} shop={shop} />)}
					</div>
				)}
			</div>
		</main>
	)
}

function ShopCard({ shop }: { shop: Barbershop }) {
	const { t } = useTranslation()
	return (
		<Link to="/barbershops/$slug" params={{ slug: shop.slug }} className="shop-card">
			<div className="shop-card-img">
				{shop.images[0] ? (
					<img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
				) : (
					<div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]"><Scissors size={36} /></div>
				)}
				{shop.isVerified && <div className="absolute top-3 left-3 badge badge-gold text-[11px]"><Check size={9} /> {t("common.verified")}</div>}
				{shop.lat !== undefined && shop.lng !== undefined && (
					<div className="absolute top-3 right-3 badge badge-gray text-[10px] gap-1"><MapPin size={10} />{t("barbershops.mapped")}</div>
				)}
			</div>
			<div className="shop-card-body">
				<div className="flex items-start justify-between gap-2 mb-1">
					<h3 className="font-bold text-[var(--text)] text-sm leading-tight">{shop.name}</h3>
					<div className="flex items-center gap-1 flex-shrink-0">
						<Star size={13} fill="currentColor" className="text-[var(--gold)]" />
						<span className="text-sm font-semibold text-[var(--text)]">{shop.rating.toFixed(1)}</span>
						<span className="text-xs text-[var(--text-muted)]">({shop.reviewCount})</span>
					</div>
				</div>
				<div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-3">
					<MapPin size={12} />{shop.address}, {shop.city}
				</div>
				<div className="flex items-center justify-between">
					<span className="text-xs text-[var(--text-subtle)]">{shop.city}</span>
					<span className="text-xs font-semibold text-[var(--gold)]">{t("common.bookNow")} →</span>
				</div>
			</div>
		</Link>
	)
}
