import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { Heart, MapPin, Star, Scissors } from "lucide-react"
import type { Barbershop, User } from "../../types"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/favorites")({ component: FavoritesPage })

function FavoritesPage() {
	const { user } = useAuth()
	const userDataRaw = useQuery(api.users.getMe, user ? { userId: user.id as Id<"users"> } : "skip")
	const userData = userDataRaw as User | null | undefined
	const favoriteIds = userData?.favoriteShopIds ?? []

	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-4xl">
				<div className="flex items-center gap-3 mb-8">
					<Link to="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm no-underline transition-colors">← Dashboard</Link>
					<span className="text-[var(--border)]">/</span>
					<h1 className="text-2xl font-bold text-[var(--text)]">Favorite Shops</h1>
				</div>

				{favoriteIds.length === 0 ? (
					<div className="text-center py-20 text-[var(--text-muted)]">
						<Heart size={40} className="mx-auto mb-4 opacity-30" />
						<p className="font-semibold text-[var(--text)] mb-1">No favorites yet</p>
						<p className="text-sm mb-4">Save your go-to barbershops for quick access</p>
						<Link to="/barbershops" className="btn btn-primary inline-flex">Browse barbershops</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
		<Link
			to="/barbershops/$slug"
			params={{ slug: shop.slug }}
			className="card card-interactive overflow-hidden block no-underline group"
		>
			<div className="h-36 bg-[var(--bg-card-hover)] flex items-center justify-center overflow-hidden">
				{shop.images[0] ? (
					<img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
				) : (
					<Scissors size={32} className="text-[var(--text-subtle)]" />
				)}
			</div>
			<div className="p-4">
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
