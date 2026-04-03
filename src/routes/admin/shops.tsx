import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ShieldCheck, ShieldOff, PowerOff, Power, Building2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "../../components/ui/Skeleton"
import { showToast } from "../../components/ui/Toast"
import type { Barbershop } from "../../types"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/admin/shops")({ component: AdminShops })

function AdminShops() {
	const { t } = useTranslation()
	const allShopsRaw = useQuery(api.barbershops.listAll)
	const allShops = allShopsRaw as Barbershop[] | undefined
	const verify = useMutation(api.barbershops.verify)
	const suspend = useMutation(api.barbershops.suspend)

	const handleVerify = async (id: Id<"barbershops">, val: boolean) => {
		try {
			await verify({ id, isVerified: val })
			showToast(val ? "Shop verified!" : "Verification removed", "success")
		} catch { showToast("Failed", "error") }
	}

	const handleSuspend = async (id: Id<"barbershops">, val: boolean) => {
		try {
			await suspend({ id, isActive: val })
			showToast(val ? "Shop reactivated" : "Shop suspended", val ? "success" : "info")
		} catch { showToast("Failed", "error") }
	}

	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-5xl">
				<div className="flex items-center gap-3 mb-6">
					<Link to="/admin" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] no-underline">← Admin</Link>
					<span className="text-[var(--border)]">/</span>
					<h1 className="text-2xl font-bold text-[var(--text)]">{t("admin.shops.title")}</h1>
				</div>

				{allShops === undefined ? (
					<div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
				) : allShops.length === 0 ? (
					<div className="text-center py-16 text-[var(--text-muted)]">
						<Building2 size={36} className="mx-auto mb-3 opacity-30" />
						<p>No shops registered yet.</p>
					</div>
				) : (
					<div className="space-y-2">
						{allShops.map((shop) => (
							<div key={shop._id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="font-medium text-[var(--text)] text-sm">{shop.name}</span>
										{shop.isVerified && <span className="badge badge-green text-[10px]"><Check size={9} /> {t("common.verified")}</span>}
										{!shop.isActive && <span className="badge badge-red text-[10px]">{t("common.suspended")}</span>}
									</div>
									<div className="text-xs text-[var(--text-muted)]">{shop.address}, {shop.city} · {shop.rating.toFixed(1)}/5 ({shop.reviewCount})</div>
								</div>
								<div className="flex gap-2 flex-wrap">
									<button
										type="button"
										onClick={() => void handleVerify(shop._id, !shop.isVerified)}
										className={`btn text-xs py-1.5 px-3 gap-1 ${shop.isVerified ? "btn-secondary" : "btn-primary"}`}
									>
										{shop.isVerified ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
										{shop.isVerified ? t("admin.shops.unverify") : t("admin.shops.verify")}
									</button>
									<button
										type="button"
										onClick={() => void handleSuspend(shop._id, !shop.isActive)}
										className={`btn text-xs py-1.5 px-3 gap-1 ${shop.isActive ? "btn-secondary" : "btn-primary"}`}
									>
										{shop.isActive ? <PowerOff size={13} /> : <Power size={13} />}
										{shop.isActive ? t("admin.shops.suspend") : t("admin.shops.reactivate")}
									</button>
									<Link to="/barbershops/$slug" params={{ slug: shop.slug }} className="btn btn-ghost text-xs py-1.5 px-3">{t("admin.shops.view")}</Link>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
