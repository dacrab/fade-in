import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Building2, ShieldCheck, Star, Users } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Skeleton } from "#/components/ui/Skeleton"
import type { UserRole } from "#/types"
import { parseUserRole } from "#/types"
import { api } from "../../../convex/_generated/api"
import type { Doc } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/admin/overview")({ component: AdminDashboard })

function RecentShopRow({ shop }: { shop: Doc<"barbershops"> }) {
	const { t } = useTranslation()
	return (
		<div className="flex items-center gap-3 py-2 border-b border-(--border) last:border-0">
			<div className="flex-1 min-w-0">
				<div className="strong-sm truncate">{shop.name}</div>
				<div className="muted-xs">{shop.city}</div>
			</div>
			<span className={`badge text-[10px] ${shop.isVerified ? "badge-green" : "badge-gold"}`}>
				{shop.isVerified ? t("common.verified") : t("admin.shops.pending")}
			</span>
			<span className={`badge text-[10px] ${shop.isActive ? "badge-green" : "badge-red"}`}>
				{shop.isActive ? t("common.active") : t("common.suspended")}
			</span>
		</div>
	)
}

function RecentShopsCard({ shops }: { shops: Doc<"barbershops">[] | undefined }) {
	const { t } = useTranslation()
	return (
		<div className="card p-5">
			<div className="section-header">
				<h2 className="font-bold text-(--text)">{t("admin.recentShops")}</h2>
				<Link to="/admin/shops" className="section-link">
					{t("admin.shops.title")} →
				</Link>
			</div>
			{!shops ? (
				<Skeleton className="h-32 w-full" />
			) : shops.length === 0 ? (
				<p className="empty-text">{t("admin.shops.noShops")}</p>
			) : (
				<div className="space-y-2">
					{shops.slice(0, 5).map((shop) => (
						<RecentShopRow key={shop._id} shop={shop} />
					))}
				</div>
			)}
		</div>
	)
}

function AdminDashboard() {
	const { t } = useTranslation()

	const allShops = useQuery(api.barbershops.listAll)
	const allUsers = useQuery(api.users.listAll)

	const roleCounts = useMemo(() => {
		const counts: Record<UserRole, number> = { customer: 0, owner: 0, barber: 0, admin: 0 }
		for (const u of allUsers ?? []) counts[parseUserRole(u.role)]++
		return counts
	}, [allUsers])

	const verified = allShops?.filter((s: Doc<"barbershops">) => s.isVerified).length ?? 0

	return (
		<main className="page-main">
			<h1 className="page-title mb-6">{t("admin.overviewTitle")}</h1>

			<div className="stat-grid stat-grid-4">
				{[
					{ label: t("admin.stats.totalShops"), value: allShops?.length ?? "—", icon: Building2 },
					{ label: t("admin.stats.verifiedShops"), value: verified, icon: ShieldCheck },
					{ label: t("admin.stats.totalUsers"), value: allUsers?.length ?? "—", icon: Users },
					{ label: t("admin.stats.owners"), value: roleCounts.owner, icon: Star },
				].map(({ label, value, icon: Icon }) => (
					<div key={label} className="card p-4">
						<Icon size={18} className="text-(--gold) mb-2" />
						<div className="page-title">{value}</div>
						<div className="muted-xs">{label}</div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<RecentShopsCard shops={allShops} />

				<div className="card p-5">
					<h2 className="font-bold text-(--text) mb-4">{t("admin.userBreakdown")}</h2>
					{!allUsers ? (
						<Skeleton className="h-32 w-full" />
					) : (
						<div className="space-y-3">
							{(
								[
									{ role: t("admin.roles.customers"), count: roleCounts.customer, color: "var(--gold)" },
									{ role: t("admin.roles.owners"), count: roleCounts.owner, color: "var(--success)" },
									{
										role: t("admin.roles.barbers"),
										count: roleCounts.barber,
										color: "var(--info)",
									},
									{
										role: t("admin.roles.admins"),
										count: roleCounts.admin,
										color: "var(--error)",
									},
								] as const
							).map(({ role, count, color }) => (
								<div key={role}>
									<div className="flex justify-between text-sm mb-1">
										<span className="text-(--text-muted)">{role}</span>
										<span className="font-semibold text-(--text)">{count}</span>
									</div>
									<div className="h-1.5 rounded-full bg-(--border) overflow-hidden">
										<div
											className="h-full rounded-full transition-all"
											style={{
												width: allUsers.length ? `${(count / allUsers.length) * 100}%` : "0%",
												background: color,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	)
}
