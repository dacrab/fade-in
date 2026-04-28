import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Building2, Check, Power, PowerOff, ShieldCheck, ShieldOff } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import { withToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import type { Barbershop } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/admin/shops")({ component: AdminShops })

interface ShopRowProps {
	shop: Barbershop
	onVerify: (id: Id<"barbershops">, val: boolean) => void
	onSuspend: (id: Id<"barbershops">, val: boolean) => void
}

function ShopRow({ shop, onVerify, onSuspend }: ShopRowProps) {
	const { t } = useTranslation()
	return (
		<div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="font-medium text-[var(--text)] text-sm">{shop.name}</span>
					{shop.isVerified && (
						<span className="badge badge-green text-[10px]">
							<Check size={9} /> {t("common.verified")}
						</span>
					)}
					{!shop.isActive && (
						<span className="badge badge-red text-[10px]">{t("common.suspended")}</span>
					)}
				</div>
				<div className="text-xs text-[var(--text-muted)]">
					{shop.address}, {shop.city} · {shop.rating.toFixed(1)}/5 ({shop.reviewCount})
				</div>
			</div>
			<div className="flex gap-2 flex-wrap">
				<button
					type="button"
					onClick={() => void onVerify(shop._id, !shop.isVerified)}
					className={`btn text-xs py-1.5 px-3 gap-1 ${shop.isVerified ? "btn-secondary" : "btn-primary"}`}
				>
					{shop.isVerified ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
					{shop.isVerified ? t("admin.shops.unverify") : t("admin.shops.verify")}
				</button>
				<button
					type="button"
					onClick={() => void onSuspend(shop._id, !shop.isActive)}
					className={`btn text-xs py-1.5 px-3 gap-1 ${shop.isActive ? "btn-secondary" : "btn-primary"}`}
				>
					{shop.isActive ? <PowerOff size={13} /> : <Power size={13} />}
					{shop.isActive ? t("admin.shops.suspend") : t("admin.shops.reactivate")}
				</button>
				<Link
					to="/barbershops/$slug"
					params={{ slug: shop.slug }}
					className="btn btn-ghost text-xs py-1.5 px-3"
				>
					{t("admin.shops.view")}
				</Link>
			</div>
		</div>
	)
}

function AdminShops() {
	const { t } = useTranslation()
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && (!user || user.role !== "admin")) {
			void router.navigate({ to: "/" })
		}
	}, [user, loading, router])

	const allShops = useQuery(api.barbershops.listAll) as Barbershop[] | undefined
	const verify = useMutation(api.barbershops.verify)
	const suspend = useMutation(api.barbershops.suspend)

	const handleVerify = (id: Id<"barbershops">, val: boolean) =>
		withToast(
			() => verify({ id, isVerified: val }),
			val ? t("admin.shops.verified") : t("admin.shops.verificationRemoved"),
			t("admin.shops.failed"),
		)

	const handleSuspend = (id: Id<"barbershops">, val: boolean) =>
		withToast(
			() => suspend({ id, isActive: val }),
			val ? t("admin.shops.reactivated") : t("admin.shops.suspended"),
			t("admin.shops.failed"),
		)

	return (
		<main className="page-main">
			<div className="page-wrap max-w-5xl">
				<div className="flex items-center justify-between mb-6">
					<div className="page-header">
						<Link to="/admin" className="breadcrumb-back">
							← {t("nav.admin")}
						</Link>
						<span className="breadcrumb-sep">/</span>
						<h1>{t("admin.shops.title")}</h1>
					</div>
				</div>

				{!allShops ? (
					<div className="space-y-3">
						{Array.from({ length: 5 }, (_, i) => (
							<Skeleton key={i} className="h-16 w-full rounded-xl" />
						))}
					</div>
				) : allShops.length === 0 ? (
					<div className="empty-state">
						<Building2 size={36} className="mx-auto mb-3 opacity-30" />
						<p className="text-sm">{t("admin.shops.noShops")}</p>
					</div>
				) : (
					<div className="space-y-2">
						{allShops.map((shop) => (
							<ShopRow key={shop._id} shop={shop} onVerify={handleVerify} onSuspend={handleSuspend} />
						))}
					</div>
				)}
			</div>
		</main>
	)
}
