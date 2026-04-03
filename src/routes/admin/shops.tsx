import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { Building2, Check, Power, PowerOff, ShieldCheck, ShieldOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import EmptyState from "#/components/EmptyState"
import SkeletonList from "#/components/SkeletonList"
import { showToast } from "#/components/ui/Toast"
import { useRequireRole } from "#/hooks/useRequireRole"
import type { Barbershop } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/admin/shops")({ component: AdminShops })

function AdminShops() {
	const { t } = useTranslation()
	useRequireRole(["admin"])
	const allShops = useQuery(api.barbershops.listAll) as Barbershop[] | undefined
	const verify = useMutation(api.barbershops.verify)
	const suspend = useMutation(api.barbershops.suspend)

	const handleVerify = async (id: Id<"barbershops">, val: boolean) => {
		try {
			await verify({ id, isVerified: val })
			showToast(val ? t("admin.shops.verified") : t("admin.shops.verificationRemoved"), "success")
		} catch {
			showToast(t("admin.shops.failed"), "error")
		}
	}

	const handleSuspend = async (id: Id<"barbershops">, val: boolean) => {
		try {
			await suspend({ id, isActive: val })
			showToast(
				val ? t("admin.shops.reactivated") : t("admin.shops.suspended"),
				val ? "success" : "info",
			)
		} catch {
			showToast(t("admin.shops.failed"), "error")
		}
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-5xl">
				<div className="page-header">
					<a href="/admin" className="breadcrumb-back">
						← {t("nav.admin")}
					</a>
					<span className="breadcrumb-sep">/</span>
					<h1>{t("admin.shops.title")}</h1>
				</div>

				{allShops === undefined ? (
					<SkeletonList count={5} height="h-16" />
				) : allShops.length === 0 ? (
					<EmptyState icon={Building2} message={t("admin.shops.noShops")} />
				) : (
					<div className="space-y-2">
						{/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: admin shop management */}
						{allShops.map((shop) => (
							<div key={shop._id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
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
									<Link
										to="/barbershops/$slug"
										params={{ slug: shop.slug }}
										className="btn btn-ghost text-xs py-1.5 px-3"
									>
										{t("admin.shops.view")}
									</Link>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
