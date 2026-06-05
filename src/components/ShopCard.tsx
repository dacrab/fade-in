import { Link } from "@tanstack/react-router"
import { Check, MapPin, Scissors, Star } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Barbershop } from "#/types"

export default function ShopCard({ shop }: { shop: Barbershop }) {
	const { t } = useTranslation()
	return (
		<Link
			to="/barbershops/$slug"
			params={{ slug: shop.slug }}
			className="shop-card block bg-white rounded-[12px] shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden no-underline"
		>
			<div className="relative w-full h-44 overflow-hidden">
				{shop.images[0] ? (
					<img
						src={shop.images[0]}
						alt={shop.name}
						className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center bg-(--bg) text-(--gold)/40">
						<Scissors size={36} />
					</div>
				)}
			</div>
			<div className="p-4">
				<div className="flex items-center gap-1.5 mb-1">
					<h3 className="font-bold text-(--text) text-[15px] leading-tight truncate">{shop.name}</h3>
					{shop.isVerified && (
						<span
							className="flex-shrink-0 w-4 h-4 rounded-full bg-(--gold) flex items-center justify-center"
							title={t("common.verified")}
						>
							<Check size={10} className="text-white" strokeWidth={3} />
						</span>
					)}
					<div className="flex items-center gap-0.5 ml-auto">
						<Star size={12} fill="currentColor" className="text-(--gold)" />
						<span className="text-sm font-medium text-(--text)">{shop.rating.toFixed(1)}</span>
					</div>
				</div>
				<div className="flex items-center gap-1 text-xs text-(--text-muted)">
					<MapPin size={11} className="flex-shrink-0" />
					<span className="truncate">
						{shop.address}, {shop.city}
					</span>
				</div>
			</div>
		</Link>
	)
}
