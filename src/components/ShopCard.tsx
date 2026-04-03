import { Link } from "@tanstack/react-router"
import { Check, MapPin, Scissors, Star } from "lucide-react"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import type { Barbershop } from "#/types"

export default memo(function ShopCard({ shop }: { shop: Barbershop }) {
	const { t } = useTranslation()
	return (
		<Link to="/barbershops/$slug" params={{ slug: shop.slug }} className="shop-card">
			<div className="shop-card-img">
				{shop.images[0] ? (
					<img
						src={shop.images[0]}
						alt={shop.name}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">
						<Scissors size={36} />
					</div>
				)}
				{shop.isVerified && (
					<div className="absolute top-3 left-3 badge badge-gold text-[11px]">
						<Check size={9} /> {t("common.verified")}
					</div>
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
					<MapPin size={12} />
					{shop.address}, {shop.city}
				</div>
				<div className="flex items-center justify-between">
					<span className="text-xs text-[var(--text-subtle)]">{shop.city}</span>
					<span className="text-xs font-semibold text-[var(--gold)]">{t("common.bookNow")} →</span>
				</div>
			</div>
		</Link>
	)
})
