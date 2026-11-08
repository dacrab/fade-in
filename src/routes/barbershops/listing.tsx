import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { usePaginatedQuery } from "convex/react"
import { Filter, List, Map as MapIcon, MapPin, Search, X } from "lucide-react"
import type { FormEvent } from "react"
import { lazy, Suspense, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import ShopCard from "#/components/ShopCard"
import { ShopCardSkeleton, Skeleton } from "#/components/ui/Skeleton"
import { PAGE_SIZE } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"

const SEARCH_DEBOUNCE_MS = 300

const MapView = lazy(() => import("#/components/MapView"))

const searchSchema = z.object({
	q: z.string().optional(),
	city: z.string().optional(),
	minRating: z.coerce.number().optional(),
})

export const Route = createFileRoute("/barbershops/listing")({
	validateSearch: searchSchema,
	component: BarbershopsPage,
})

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: large linear JSX view component
function BarbershopsPage() {
	const { t } = useTranslation()
	const { q, city: cityParam, minRating: minRatingParam } = Route.useSearch()
	const navigate = useNavigate()
	const [search, setSearch] = useState(q ?? "")
	const [city, setCity] = useState(cityParam ?? "")
	const [minRating, setMinRating] = useState(minRatingParam ?? 0)
	const [view, setView] = useState<"list" | "map">("list")
	const [showFilters, setShowFilters] = useState(false)
	const [debouncedSearch, setDebouncedSearch] = useState(search)

	// Re-sync the input state when the URL search changes (back/forward, links)
	// so the form never drifts from the address bar.
	useEffect(() => {
		setSearch(q ?? "")
		setCity(cityParam ?? "")
		setMinRating(minRatingParam ?? 0)
	}, [q, cityParam, minRatingParam])

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(timer)
	}, [search])

	const { results, isLoading, status, loadMore } = usePaginatedQuery(
		api.barbershops.list,
		{
			city: city || undefined,
			search: debouncedSearch || undefined,
			minRating: minRating > 0 ? minRating : undefined,
		},
		{ initialNumItems: PAGE_SIZE },
	)
	const shops = results

	const handleSearch = (e: FormEvent) => {
		e.preventDefault()
		setDebouncedSearch(search)
		void navigate({
			to: "/barbershops/listing",
			search: (prev: z.infer<typeof searchSchema>) => ({
				...prev,
				q: search || undefined,
				city: city || undefined,
				minRating: minRating > 0 ? minRating : undefined,
			}),
		})
	}

	const resetFilters = () => {
		setSearch("")
		setCity("")
		setMinRating(0)
		// Keep the URL in sync with the reset filters so a reload
		// or share does not silently restore them.
		void navigate({
			to: "/barbershops/listing",
			search: (prev: z.infer<typeof searchSchema>) => ({
				...prev,
				q: undefined,
				city: undefined,
				minRating: undefined,
			}),
		})
	}

	return (
		<main className="page-main">
			<div className="page-container">
				<div className="mb-9 border-b border-(--border) pb-7">
					<p className="eyebrow">{t("nav.barbershops")}</p>
					<div className="mt-3 flex flex-wrap items-end justify-between gap-4">
						<h1 className="display text-[clamp(2.4rem,5vw,3.75rem)] text-(--text)">
							{t("barbershops.title")}
						</h1>
						<p className="pb-1 text-[13px] text-(--text-muted)">
							{isLoading ? t("common.loading") : t("barbershops.found", { count: shops.length })}
						</p>
					</div>
				</div>

				<form onSubmit={handleSearch} className="mb-5">
					<div className="flex flex-col rounded-(--radius-lg) border border-(--border) bg-(--bg-card) p-2 shadow-[var(--shadow-xs)] sm:flex-row sm:items-stretch">
						<div className="flex flex-1 items-center gap-2.5 rounded-(--radius) px-3 py-2 transition-colors focus-within:bg-(--bg-input)/60">
							<Search size={16} className="shrink-0 text-(--text-subtle)" />
							<input
								className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-(--text) outline-none placeholder:text-(--text-subtle)"
								placeholder={t("barbershops.searchPlaceholder")}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								aria-label={t("barbershops.searchPlaceholder")}
							/>
						</div>
						<div className="hidden w-px self-stretch bg-(--border) sm:block" />
						<div className="h-px w-full bg-(--border) sm:hidden" />
						<div className="flex flex-1 items-center gap-2.5 rounded-(--radius) px-3 py-2 transition-colors focus-within:bg-(--bg-input)/60">
							<MapPin size={15} className="shrink-0 text-(--text-subtle)" />
							<input
								className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-(--text) outline-none placeholder:text-(--text-subtle)"
								placeholder={t("home.cityPlaceholder")}
								value={city}
								onChange={(e) => setCity(e.target.value)}
								aria-label={t("home.cityLabel")}
							/>
						</div>

						<div className="mt-2 flex items-center gap-2 sm:mt-0 sm:contents">
							<button
								type="button"
								onClick={() => setShowFilters(!showFilters)}
								aria-label={t("common.filter")}
								aria-expanded={showFilters}
								className={`relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-(--radius) border px-3 py-2.5 text-[12px] font-semibold transition-colors ${
									showFilters || minRating > 0
										? "border-(--gold)/30 bg-(--gold)/8 text-(--gold)"
										: "border-transparent text-(--text-muted) hover:bg-(--bg-input) hover:text-(--text)"
								}`}
							>
								<Filter size={14} />
								<span>{t("common.filter")}</span>
							</button>

							<button type="submit" className="btn btn-primary flex-1 sm:flex-none sm:px-5">
								{t("common.search")}
							</button>

							<div className="ml-auto flex shrink-0 rounded-(--radius) border border-(--border) p-0.5 sm:ml-0">
								{(["list", "map"] as const).map((v) => (
									<button
										key={v}
										type="button"
										onClick={() => setView(v)}
										aria-label={v === "list" ? t("barbershops.listView") : t("barbershops.mapView")}
										aria-pressed={view === v}
										className={`flex items-center gap-1.5 rounded-[3px] px-3 py-2 text-[11.5px] font-semibold transition-colors ${
											view === v ? "bg-(--ink) text-(--bg)" : "text-(--text-muted) hover:text-(--text)"
										}`}
									>
										{v === "list" ? <List size={13} /> : <MapIcon size={13} />}
										<span className="hidden lg:inline">
											{v === "list" ? t("barbershops.listView") : t("barbershops.mapView")}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>
				</form>

				{showFilters && (
					<div className="mb-6 rounded-(--radius-lg) border border-(--border) bg-(--bg-card) p-5 fade-in">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
							<div className="w-full max-w-sm">
								<div className="mb-3 flex items-center justify-between">
									<p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
										{t("barbershops.minRating")}
									</p>
									<span className="text-[12px] font-semibold text-(--gold)">
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
									className="h-1 w-full cursor-pointer appearance-none rounded-full bg-(--border) accent-(--gold) [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-(--gold)"
								/>
								<div className="mt-1.5 flex justify-between text-[10px] text-(--text-subtle)">
									<span>{t("common.anyRating")}</span>
									<span>5</span>
								</div>
							</div>
							{minRating > 0 && (
								<button
									type="button"
									onClick={() => setMinRating(0)}
									className="flex w-fit items-center gap-1 text-xs text-(--text-muted) transition-colors hover:text-(--gold)"
								>
									<X size={12} />
									{t("common.reset")}
								</button>
							)}
						</div>
					</div>
				)}

				{view === "map" ? (
					<Suspense fallback={<Skeleton className="h-125 w-full rounded-(--radius-lg)" />}>
						<MapView
							shops={shops}
							onShopClick={(slug) => void navigate({ to: "/barbershops/$slug", params: { slug } })}
						/>
					</Suspense>
				) : isLoading ? (
					<div className="shop-grid">
						{[0, 1, 2, 3, 4, 5].map((i) => (
							<ShopCardSkeleton key={i} />
						))}
					</div>
				) : shops.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-(--radius-lg) border border-(--border) bg-(--bg-card) px-6 py-16 text-center">
						<span className="font-serif text-5xl font-medium italic text-(--gold)/30">0</span>
						<p className="mt-5 font-serif text-2xl font-medium tracking-[-0.02em] text-(--text)">
							{t("barbershops.noShops")}
						</p>
						<p className="mt-2 max-w-sm text-sm text-(--text-muted)">{t("barbershops.noShopsHint")}</p>
						{(search || city || minRating > 0) && (
							<button type="button" onClick={resetFilters} className="btn btn-secondary mt-6">
								{t("barbershops.clearFilters")}
							</button>
						)}
					</div>
				) : (
					<>
						<div className="shop-grid">
							{shops.map((shop: Doc<"barbershops">) => (
								<ShopCard key={shop._id} shop={shop} />
							))}
						</div>
						{status === "CanLoadMore" && (
							<div className="mt-10 flex justify-center">
								<button type="button" onClick={() => loadMore(PAGE_SIZE)} className="btn btn-secondary">
									{t("common.loadMore")}
								</button>
							</div>
						)}
					</>
				)}
			</div>
		</main>
	)
}
