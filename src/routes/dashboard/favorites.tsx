import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Heart } from "lucide-react"
import { useTranslation } from "react-i18next"
import ShopCard from "#/components/ShopCard"
import { useAuth } from "#/hooks/useAuth"
import type { Barbershop, User } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/favorites")({ component: FavoritesPage })

function FavoritesPage() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const userDataRaw = useQuery(api.users.getById, user ? { id: user.id as Id<"users"> } : "skip")
	const userData = userDataRaw as User | null | undefined
	const favoriteIds = userData?.favoriteShopIds ?? []

	// Single query fetches all favorite shops at once instead of one query per shop.
	const shopsRaw = useQuery(
		api.barbershops.listByIds,
		favoriteIds.length > 0 ? { ids: favoriteIds } : "skip",
	)
	const shops = (shopsRaw ?? []) as Barbershop[]

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
						<Link to="/barbershops" className="btn btn-primary inline-flex">
							{t("nav.barbershops")}
						</Link>
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
