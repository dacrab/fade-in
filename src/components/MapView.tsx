import { MapPin } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { Barbershop } from "#/types"

interface MapViewProps {
	shops: Barbershop[]
	onShopClick?: (slug: string) => void
}

const DEFAULT_CENTER: [number, number] = [37.9838, 23.7275]
const DEFAULT_ZOOM = 12

export default function MapView({ shops, onShopClick }: MapViewProps) {
	const { t } = useTranslation()
	const mapRef = useRef<L.Map | null>(null)
	const mapContainerRef = useRef<HTMLDivElement>(null)
	const markersRef = useRef<L.Marker[]>([])

	const shopsWithCoords = useMemo(
		() =>
			shops.filter(
				(s): s is Barbershop & { lat: number; lng: number } =>
					s.lat !== undefined && s.lng !== undefined,
			),
		[shops],
	)

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return

		import("leaflet").then((L) => {
			const iconProto = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown }
			iconProto._getIconUrl = undefined
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
				iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
				shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
			})
			if (!mapContainerRef.current) return
			const map = L.map(mapContainerRef.current, {
				center: DEFAULT_CENTER,
				zoom: DEFAULT_ZOOM,
				zoomControl: true,
				scrollWheelZoom: false,
			})
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution: "© OpenStreetMap contributors",
				maxZoom: 19,
			}).addTo(map)
			mapRef.current = map
		})

		return () => {
			if (mapRef.current) {
				mapRef.current.remove()
				mapRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		if (!mapRef.current) return
		import("leaflet").then((L) => {
			if (!mapRef.current) return

			for (const m of markersRef.current) m.remove()
			markersRef.current = []

			if (shopsWithCoords.length === 0) return

			const goldIcon = L.divIcon({
				html:
					'<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,var(--gold),var(--gold-dark));transform:rotate(-45deg);border:2px solid var(--bg);box-shadow:0 4px 12px rgba(200,75,49,0.4);display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg></div>',
				className: "",
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				popupAnchor: [0, -36],
			})

			const bounds: [number, number][] = []

			for (const shop of shopsWithCoords) {
				const marker = L.marker([shop.lat, shop.lng], { icon: goldIcon })
					.addTo(mapRef.current)
					.bindPopup(
						`<div style="font-family:'Inter',system-ui,sans-serif;min-width:160px;padding:4px;">
						<div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#1A1714;">${shop.name}</div>
						<div style="font-size:12px;color:#6B6560;margin-bottom:6px;">${shop.address}, ${shop.city}</div>
						<div style="font-size:12px;color:var(--gold);margin-bottom:8px;">${shop.rating.toFixed(1)} / 5 (${t("map.reviewsCount", { count: shop.reviewCount })})</div>
						<a href="/barbershops/${shop.slug}" style="display:block;text-align:center;padding:6px 12px;background:linear-gradient(135deg,var(--gold),#A63D28);color:#fff;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">${t("map.bookNowArrow")} →</a>
					</div>`,
						{ className: "fadein-popup" },
					)

				if (onShopClick) marker.on("click", () => onShopClick(shop.slug))
				markersRef.current.push(marker)
				bounds.push([shop.lat, shop.lng])
			}

			if (bounds.length > 0) mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
		})
	}, [shopsWithCoords, onShopClick, t])

	return (
		<div className="relative rounded-2xl overflow-hidden border border-white/6 h-125">
			<div ref={mapContainerRef} className="w-full h-full" />
			{shopsWithCoords.length === 0 && (
				<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
					<MapPin size={28} className="mb-2 text-(--text-subtle) opacity-40" />
					<p className="text-sm font-medium text-white/70">{t("map.noLocations")}</p>
					<p className="text-xs mt-1 text-(--text-subtle)">{t("map.noLocationsHint")}</p>
				</div>
			)}
			<div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-medium text-white/70 bg-black/40 backdrop-blur-md border border-white/8 z-[1000]">
				{t("map.shopsOnMap", { count: shopsWithCoords.length })}
			</div>
		</div>
	)
}
