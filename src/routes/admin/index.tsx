import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Building2, ShieldCheck, Star, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import StatsGrid from "#/components/StatsGrid"
import { Skeleton } from "#/components/ui/Skeleton"
import { useRequireRole } from "#/hooks/useRequireRole"
import type { Barbershop, User } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/admin/")({ component: AdminDashboard })

function AdminDashboard() {
	const { t } = useTranslation()
	const { user, loading } = useRequireRole(["admin"])

	const allShopsRaw = useQuery(api.barbershops.listAll)
	const allUsersRaw = useQuery(api.users.listAll)
	const allShops = allShopsRaw as Barbershop[] | undefined
	const allUsers = allUsersRaw as User[] | undefined

	if (loading || !user) return <Skeleton className="h-64 m-8 rounded-2xl" />

	const verified = allShops?.filter((s) => s.isVerified).length ?? 0
	const owners = allUsers?.filter((u) => u.role === "owner").length ?? 0
	const customers = allUsers?.filter((u) => u.role === "customer").length ?? 0

	const navLinks = [
		{ to: "/admin", label: t("admin.overviewTitle"), icon: ShieldCheck },
		{ to: "/admin/shops", label: t("admin.shops.title"), icon: Building2 },
		{ to: "/admin/users", label: t("admin.users.title"), icon: Users },
	] as const

	return (
		<main>
			<div className="dashboard-layout">
				<aside className="bg-card border-r border-[var(--border)] px-4 py-6 hidden md:block">
					<div className="mb-6">
						<h2 className="font-bold text-[var(--text)]">{t("admin.title")}</h2>
						<p className="text-xs text-[var(--text-muted)]">{t("admin.subtitle")}</p>
					</div>
					<nav className="space-y-1">
						{navLinks.map(({ to, label, icon: Icon }) => (
							<Link
								key={to}
								to={to}
								className="sidebar-link"
								activeProps={{ className: "sidebar-link active" }}
							>
								<Icon size={16} />
								{label}
							</Link>
						))}
					</nav>
				</aside>

				<div className="page-main">
					<h1 className="text-2xl font-bold text-[var(--text)] mb-6">{t("admin.overviewTitle")}</h1>

					<StatsGrid
						cols={4}
						stats={[
							{ label: t("admin.stats.totalShops"), value: allShops?.length ?? "—", icon: Building2 },
							{ label: t("admin.stats.verifiedShops"), value: verified, icon: ShieldCheck },
							{ label: t("admin.stats.totalUsers"), value: allUsers?.length ?? "—", icon: Users },
							{ label: t("admin.stats.owners"), value: owners, icon: Star },
						]}
					/>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="card p-5">
							<div className="section-header">
								<h2 className="font-bold text-[var(--text)]">{t("admin.recentShops")}</h2>
								<Link to="/admin/shops" className="section-link">
									{t("admin.shops.title")} →
								</Link>
							</div>
							{!allShops ? (
								<Skeleton className="h-32 w-full" />
							) : (
								<div className="space-y-2">
									{allShops.slice(0, 5).map((shop) => (
										<div
											key={shop._id}
											className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0"
										>
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-[var(--text)] truncate">{shop.name}</div>
												<div className="text-xs text-[var(--text-muted)]">{shop.city}</div>
											</div>
											<span className={`badge text-[10px] ${shop.isVerified ? "badge-green" : "badge-gold"}`}>
												{shop.isVerified ? t("common.verified") : t("admin.shops.pending")}
											</span>
											<span className={`badge text-[10px] ${shop.isActive ? "badge-green" : "badge-red"}`}>
												{shop.isActive ? t("common.active") : t("common.suspended")}
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="card p-5">
							<h2 className="font-bold text-[var(--text)] mb-4">{t("admin.userBreakdown")}</h2>
							{!allUsers ? (
								<Skeleton className="h-32 w-full" />
							) : (
								<div className="space-y-3">
									{(
										[
											{ role: t("admin.roles.customers"), count: customers, color: "var(--gold)" },
											{ role: t("admin.roles.owners"), count: owners, color: "var(--success)" },
											{
												role: t("admin.roles.barbers"),
												count: allUsers.filter((u) => u.role === "barber").length,
												color: "#818CF8",
											},
											{
												role: t("admin.roles.admins"),
												count: allUsers.filter((u) => u.role === "admin").length,
												color: "var(--error)",
											},
										] as const
									).map(({ role, count, color }) => (
										<div key={role}>
											<div className="flex justify-between text-sm mb-1">
												<span className="text-[var(--text-muted)]">{role}</span>
												<span className="font-semibold text-[var(--text)]">{count}</span>
											</div>
											<div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
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
				</div>
			</div>
		</main>
	)
}
