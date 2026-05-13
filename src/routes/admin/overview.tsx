import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Building2, ShieldCheck, Star, Users } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import AdminNav from "#/components/AdminNav"
import { Skeleton } from "#/components/ui/Skeleton"
import { useAuth } from "#/hooks/useAuth"
import type { Barbershop, User } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/admin/overview")({ component: AdminDashboard })

function AdminDashboard() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!user) return
		if (user.role !== "admin") navigate({ to: "/" })
	}, [user, navigate])

	const allShops = useQuery(api.barbershops.listAll) as Barbershop[] | undefined
	const allUsers = useQuery(api.users.listAll) as User[] | undefined

	if (!user) return <Skeleton className="h-64 m-8 rounded-2xl" />

	const verified = allShops?.filter((s) => s.isVerified).length ?? 0
	const owners = allUsers?.filter((u) => u.role === "owner").length ?? 0
	const customers = allUsers?.filter((u) => u.role === "customer").length ?? 0

	return (
		<main>
			<div className="dashboard-layout">
				<AdminNav />

				<div className="page-main">
					<h1 className="text-2xl font-bold text-(--text) mb-6">{t("admin.overviewTitle")}</h1>

					<div className="stat-grid stat-grid-4">
						{[
							{ label: t("admin.stats.totalShops"), value: allShops?.length ?? "—", icon: Building2 },
							{ label: t("admin.stats.verifiedShops"), value: verified, icon: ShieldCheck },
							{ label: t("admin.stats.totalUsers"), value: allUsers?.length ?? "—", icon: Users },
							{ label: t("admin.stats.owners"), value: owners, icon: Star },
						].map(({ label, value, icon: Icon }) => (
							<div key={label} className="card p-4">
								<Icon size={18} className="text-(--gold) mb-2" />
								<div className="text-2xl font-bold text-(--text)">{value}</div>
								<div className="text-xs text-(--text-muted)">{label}</div>
							</div>
						))}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="card p-5">
							<div className="section-header">
								<h2 className="font-bold text-(--text)">{t("admin.recentShops")}</h2>
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
											className="flex items-center gap-3 py-2 border-b border-(--border) last:border-0"
										>
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-(--text) truncate">{shop.name}</div>
												<div className="text-xs text-(--text-muted)">{shop.city}</div>
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
							<h2 className="font-bold text-(--text) mb-4">{t("admin.userBreakdown")}</h2>
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
				</div>
			</div>
		</main>
	)
}
