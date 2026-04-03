import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { Heart, MapPin, Star, Scissors } from "lucide-react"
import type { Barbershop, User } from "../../types"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/favorites")({ component: FavoritesPage })

function FavoritesPage() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const userDataRaw = useQuery(api.users.getMe, user ? { userId: user.id as Id<"users"> } : "skip")
	const userData = userDataRaw as User | null | undefined
	const favoriteIds = userData?.favoriteShopIds ?? []

	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl">
				<div className="page-header">
					<Link to="/dashboard" className="breadcrumb-back">
						← {t("nav.dashboard")}
					</Link>
					<span className="text-[var(--border)]">/</span>
					<h1 className="text-2xl font-bold text-[var(--text)]">{t("dashboard.favoritesTitle")}</h1>
				</div>

				{favoriteIds.length === 0 ? (
					<div className="empty-state">
						<Heart size={40} className="mx-auto mb-4 opacity-30" />
						<p className="font-semibold text-[var(--text)] mb-1">{t("dashboard.noFavorites")}</p>
						<p className="text-sm mb-4">{t("dashboard.noFavoritesHint")}</p>
						<Link to="/barbershops" className="btn btn-primary inline-flex">{t("nav.barbershops")}</Link>
					</div>
				) : (
					<div className="shop-grid">
						{favoriteIds.map((shopId) => (
							<FavoriteShopCard key={shopId} shopId={shopId} />
						))}
					</div>
				)}
			</div>
		</main>
	)
}

function FavoriteShopCard({ shopId }: { shopId: Id<"barbershops"> }) {
	const shopRaw = useQuery(api.barbershops.getById, { id: shopId })
	const shop = shopRaw as Barbershop | null | undefined
	if (!shop) return null
	return (
		<Link to="/barbershops/$slug" params={{ slug: shop.slug }} className="shop-card">
			<div className="shop-card-img">
				{shop.images[0] ? (
					<img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
				) : (
					<Scissors size={32} className="text-[var(--text-subtle)]" />
				)}
			</div>
			<div className="shop-card-body">
				<div className="flex items-start justify-between gap-2 mb-1">
					<h3 className="font-bold text-[var(--text)] text-sm">{shop.name}</h3>
					<div className="flex items-center gap-1">
						<Star size={13} fill="currentColor" className="text-[var(--gold)]" />
						<span className="text-xs font-semibold text-[var(--text)]">{shop.rating.toFixed(1)}</span>
					</div>
				</div>
				<div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
					<MapPin size={12} />{shop.address}, {shop.city}
				</div>
			</div>
		</Link>
	)
}
