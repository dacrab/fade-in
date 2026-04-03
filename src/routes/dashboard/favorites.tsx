import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Heart } from "lucide-react"
import { useTranslation } from "react-i18next"
import Breadcrumb from "#/components/Breadcrumb"
import EmptyState from "#/components/EmptyState"
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

	const shopsRaw = useQuery(
		api.barbershops.listByIds,
		favoriteIds.length > 0 ? { ids: favoriteIds } : "skip",
	)
	const shops = (shopsRaw ?? []) as Barbershop[]

	return (
		<main className="page-main">
			<div className="page-wrap max-w-4xl">
				<Breadcrumb to="/dashboard" label={t("nav.dashboard")} title={t("dashboard.favoritesTitle")} />

				{favoriteIds.length === 0 ? (
					<EmptyState icon={Heart} message={t("dashboard.noFavorites")}>
						<p className="text-sm mb-4">{t("dashboard.noFavoritesHint")}</p>
						<Link to="/barbershops" className="btn btn-primary inline-flex">
							{t("nav.barbershops")}
						</Link>
					</EmptyState>
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
