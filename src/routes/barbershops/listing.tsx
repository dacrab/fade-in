import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Filter, List, Map as MapIcon, MapPin, Scissors, Search, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import MapView from "#/components/MapView"
import ShopCard from "#/components/ShopCard"
import { ShopCardSkeleton } from "#/components/ui/Skeleton"
import type { Barbershop } from "#/types"
import { api } from "../../../convex/_generated/api"

const searchSchema = z.object({
	q: z.string().optional(),
	city: z.string().optional(),
	minRating: z.coerce.number().optional(),
})

export const Route = createFileRoute("/barbershops/listing")({
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

	const shopsResult = useQuery(api.barbershops.list, {
		city: city || undefined,
		search: search || undefined,
		minRating: minRating > 0 ? minRating : undefined,
		paginationOpts: { cursor: null, numItems: 50 },
	})
	const shops = shopsResult?.page as Barbershop[] | undefined

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		void navigate({
			to: "/barbershops/listing",
			search: (prev) => ({
				...prev,
				q: search || undefined,
				city: city || undefined,
				minRating: minRating > 0 ? minRating : undefined,
			}),
		})
	}

	return (
		<main className="page-main">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Page Title */}
				<div className="mb-10">
					<h1 className="text-4xl sm:text-5xl font-bold text-(--text) tracking-tight">
						{t("barbershops.title")}
					</h1>
					<p className="text-(--text-muted) text-sm mt-2 tracking-wide">
						{shops === undefined ? t("common.loading") : t("barbershops.found", { count: shops.length })}
					</p>
				</div>

				{/* Search Bar + View Toggle */}
				<form onSubmit={handleSearch} className="mb-6">
					<div className="flex items-center gap-3">
						<div className="flex-1 flex items-center rounded-full bg-(--bg-card) border border-[var(--gold)/15] overflow-hidden transition-all duration-300 focus-within:border-(--gold)/40 focus-within:shadow-[0_0_20px_var(--gold)/8]">
							<div className="flex items-center pl-5 pr-2">
								<Search size={16} className="text-(--text-subtle)" />
							</div>
							<input
								className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-(--text) placeholder:text-(--text-subtle)"
								placeholder={t("barbershops.searchPlaceholder")}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<div className="w-px h-5 bg-(--border) opacity-50" />
							<div className="flex items-center pl-2 pr-1">
								<MapPin size={14} className="text-(--text-subtle)" />
							</div>
							<input
								className="w-32 sm:w-40 bg-transparent border-none outline-none py-3 pr-4 text-sm text-(--text) placeholder:text-(--text-subtle)"
								placeholder={t("home.cityPlaceholder")}
								value={city}
								onChange={(e) => setCity(e.target.value)}
							/>
						</div>

						{/* Filter Toggle */}
						<button
							type="button"
							onClick={() => setShowFilters(!showFilters)}
							className={`relative flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-medium transition-all duration-300 ${
								showFilters
									? "bg-(--gold)/15 text-(--gold) border border-(--gold)/30"
									: "bg-(--bg-card) text-(--text-muted) border border-[var(--gold)/10] hover:border-(--gold)/25 hover:text-(--text)"
							}`}
						>
							<Filter size={14} />
							<span className="hidden sm:inline">{t("common.filter")}</span>
							{minRating > 0 && (
								<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-(--gold) text-white text-[9px] flex items-center justify-center font-bold">
									{minRating}
								</span>
							)}
						</button>

						{/* View Toggle - Pill Segmented Control */}
						<div className="flex rounded-full bg-(--bg-card) border border-[var(--gold)/10] p-1">
							{(["list", "map"] as const).map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => setView(v)}
									className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
										view === v
											? "bg-(--gold) text-white shadow-[0_2px_8px_rgba(200,75,49,0.3)]"
											: "text-(--text-muted) hover:text-(--text)"
									}`}
								>
									{v === "list" ? <List size={13} /> : <MapIcon size={13} />}
									<span className="hidden sm:inline">
										{v === "list" ? t("barbershops.listView") : t("barbershops.mapView")}
									</span>
								</button>
							))}
						</div>
					</div>
				</form>

				{/* Filter Panel - Inline, minimal */}
				{showFilters && (
					<div className="mb-5 px-1 animate-[fadeUp_0.3s_ease]">
						<div className="flex items-center gap-6">
							<div className="flex-1 max-w-sm">
								<div className="flex items-center justify-between mb-2">
									<p className="text-xs font-medium text-(--text-muted) tracking-wide uppercase">
										{t("barbershops.minRating")}
									</p>
									<span className="text-sm font-semibold text-(--gold)">
										{minRating === 0
											? t("common.anyRating")
											: t("barbershops.ratingAbove", { rating: minRating })}
									</span>
								</div>
								<input
									type="range"
									min={0}
									max={5}
									step={0.5}
									value={minRating}
									onChange={(e) => setMinRating(Number(e.target.value))}
									className="w-full h-1 rounded-full appearance-none cursor-pointer bg-(--border) accent-(--gold) [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-(--gold) [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(200,75,49,0.4)]"
								/>
								<div className="flex justify-between text-[10px] text-(--text-subtle) mt-1 tracking-wide">
									<span>{t("common.anyRating")}</span>
									<span>5</span>
								</div>
							</div>
							{minRating > 0 && (
								<button
									type="button"
									onClick={() => setMinRating(0)}
									className="flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--gold) transition-colors"
								>
									<X size={12} />
									{t("common.reset")}
								</button>
							)}
						</div>
					</div>
				)}

				{/* Content */}
				{view === "map" ? (
					<MapView
						shops={shops ?? []}
						onShopClick={(slug) => void navigate({ to: "/barbershops/$slug", params: { slug } })}
					/>
				) : shops === undefined ? (
					<div className="shop-grid">
						{[0, 1, 2, 3, 4, 5].map((i) => (
							<ShopCardSkeleton key={i} />
						))}
					</div>
				) : shops.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<div className="w-20 h-20 rounded-full bg-[var(--gold)/8] flex items-center justify-center mb-6">
							<Scissors size={32} className="text-(--gold)/40" />
						</div>
						<p className="text-xl font-semibold text-(--text) mb-2">{t("barbershops.noShops")}</p>
						<p className="text-sm text-(--text-muted) mb-6 max-w-sm">{t("barbershops.noShopsHint")}</p>
						{(search || city || minRating > 0) && (
							<button
								type="button"
								onClick={() => {
									setSearch("")
									setCity("")
									setMinRating(0)
								}}
								className="px-6 py-2.5 rounded-full text-sm font-medium bg-(--bg-card) border border-[rgba(200,75,49,0.2)] text-(--text) hover:border-(--gold)/40 transition-all duration-300"
							>
								{t("barbershops.clearFilters")}
							</button>
						)}
					</div>
				) : (
					<div className="shop-grid">
						{shops.map((shop) => (
							<ShopCard key={shop._id} shop={shop} />
						))}
					</div>
				)}
			</div>
		</main>
	)
}
