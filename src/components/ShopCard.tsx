import { Link } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { ArrowUpRight, Check, Heart, MapPin, Star } from "lucide-react"
import type { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { withToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import type { Barbershop } from "#/types"
import { api } from "../../convex/_generated/api"

export default function ShopCard({ shop }: { shop: Barbershop }) {
	const { t } = useTranslation()
	const { user } = useAuth()
	const toggleFavorite = useMutation(api.users.toggleFavorite)
	const isFavorited = user?.favoriteShopIds.includes(shop._id) ?? false

	const handleToggleFav = (e: MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		void withToast(
			() => toggleFavorite({ barbershopId: shop._id }),
			isFavorited ? t("common.removeFromFavorites") : t("common.addToFavorites"),
			t("errors.shopFailed"),
		)
	}

	return (
		<div className="group relative">
			<Link
				to="/barbershops/$slug"
				params={{ slug: shop.slug }}
				className="block overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--bg-card) no-underline transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-(--border-hover) hover:shadow-[var(--shadow-sm)]"
			>
				<div className="relative aspect-[4/3] w-full overflow-hidden bg-(--bg-input)">
					{shop.images[0] ? (
						<img
							src={shop.images[0]}
							alt={shop.name}
							className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
							loading="lazy"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-[#efe5d8]">
							<span className="font-serif text-6xl font-medium italic text-(--gold)/30">
								{shop.name.charAt(0)}
							</span>
						</div>
					)}
					<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-70" />
					{shop.isVerified && (
						<span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-(--radius-sm) border border-white/40 bg-white/85 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-(--ink) backdrop-blur-sm">
							<Check size={10} strokeWidth={2.5} className="text-(--gold)" />
							{t("common.verified")}
						</span>
					)}
					<span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-(--radius-sm) bg-black/35 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
						<Star size={11} fill="currentColor" className="text-[#f3c67c]" />
						{shop.rating.toFixed(1)}
						<span className="font-normal text-white/60">({shop.reviewCount})</span>
					</span>
				</div>

				<div className="p-5">
					<h3 className="font-serif text-[1.25rem] font-medium leading-tight tracking-[-0.022em] text-(--text)">
						{shop.name}
					</h3>
					<p className="mt-1.5 flex items-center gap-1.5 text-xs text-(--text-muted)">
						<MapPin size={12} className="shrink-0 text-(--text-subtle)" />
						<span className="truncate">
							{shop.address}, {shop.city}
						</span>
					</p>

					<div className="mt-4 flex items-center justify-between border-t border-(--border) pt-3">
						<span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-(--text-subtle)">
							{shop.city}
						</span>
						<span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-(--text) transition-colors group-hover:text-(--gold)">
							{t("common.bookNow")}
							<ArrowUpRight
								size={13}
								className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
							/>
						</span>
					</div>
				</div>
			</Link>

			{user && (
				<button
					type="button"
					onClick={handleToggleFav}
					className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-(--radius-sm) border border-white/40 bg-white/85 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
					title={t(isFavorited ? "common.removeFromFavorites" : "common.addToFavorites")}
					aria-label={t(isFavorited ? "common.removeFromFavorites" : "common.addToFavorites")}
					aria-pressed={isFavorited}
				>
					<Heart
						size={14}
						className={isFavorited ? "fill-(--error) text-(--error)" : "text-(--text-muted)"}
					/>
				</button>
			)}
		</div>
	)
}
