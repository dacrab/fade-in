import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { ArrowLeft, Heart } from "lucide-react"
import { useTranslation } from "react-i18next"
import ShopCard from "#/components/ShopCard"
import { useAuth } from "#/hooks/useAuth"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/favorites")({ component: FavoritesPage })

function FavoritesPage() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const favoriteIds = user?.favoriteShopIds ?? []

	const shopsRaw = useQuery(
		api.barbershops.listByIds,
		favoriteIds.length > 0 ? { ids: favoriteIds } : "skip",
	)
	const shops =
		shopsRaw?.filter((s: Doc<"barbershops"> | null): s is Doc<"barbershops"> => s != null) ?? []

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl py-8">
				<Link
					to="/dashboard/overview"
					className="inline-flex items-center gap-1.5 muted-xs hover:text-(--text) mb-4"
				>
					<ArrowLeft size={12} /> {t("nav.dashboard")}
				</Link>
				<h1 className="page-title mb-6">{t("dashboard.favoritesTitle")}</h1>

				{favoriteIds.length === 0 ? (
					<div className="card p-8 text-center">
						<Heart size={24} className="mx-auto mb-2 text-(--text-subtle)" />
						<p className="muted-sm mb-1">{t("dashboard.noFavorites")}</p>
						<p className="subtle-xs mb-4">{t("dashboard.noFavoritesHint")}</p>
						<Link to="/barbershops/listing" className="btn btn-primary btn-sm">
							{t("nav.barbershops")}
						</Link>
					</div>
				) : (
					<div className="shop-grid">
						{shops.map((shop: Doc<"barbershops">) => (
							<ShopCard key={shop._id} shop={shop} />
						))}
					</div>
				)}
			</div>
		</main>
	)
}
