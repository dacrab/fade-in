import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { Users, Building2, Star, ShieldCheck } from "lucide-react"
import { Skeleton } from "../../components/ui/Skeleton"
import type { Barbershop, User } from "../../types"

export const Route = createFileRoute("/admin/")({ component: AdminDashboard })

function AdminDashboard() {
	const { t } = useTranslation()
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && (!user || user.role !== "admin")) void router.navigate({ to: "/" })
	}, [user, loading, router])

	const allShopsRaw = useQuery(api.barbershops.listAll)
	const allUsersRaw = useQuery(api.users.listAll)
	const allShops = allShopsRaw as Barbershop[] | undefined
	const allUsers = allUsersRaw as User[] | undefined

	if (loading || !user) return <Skeleton className="h-64 m-8 rounded-2xl" />

	const verified = allShops?.filter((s) => s.isVerified).length ?? 0
	const owners = allUsers?.filter((u) => u.role === "owner").length ?? 0
	const customers = allUsers?.filter((u) => u.role === "customer").length ?? 0

	const navLinks = [
		{ to: "/admin", label: "Overview", icon: ShieldCheck },
		{ to: "/admin/shops", label: "Shops", icon: Building2 },
		{ to: "/admin/users", label: "Users", icon: Users },
	] as const

	return (
		<main>
			<div className="dashboard-layout">
				<aside className="border-r border-[var(--border)] px-4 py-6 hidden md:block" style={{ background: "var(--bg-card)" }}>
					<div className="mb-6">
						<h2 className="font-bold text-[var(--text)]">{t("admin.title")}</h2>
						<p className="text-xs text-[var(--text-muted)]">{t("admin.subtitle")}</p>
					</div>
					<nav className="space-y-1">
						{navLinks.map(({ to, label, icon: Icon }) => (
							<Link key={to} to={to} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]" activeProps={{ style: { color: "var(--gold)", background: "rgba(245,158,11,0.08)" } }}>
								<Icon size={16} />{label}
							</Link>
						))}
					</nav>
				</aside>

				<div className="px-6 py-6">
					<h1 className="text-2xl font-bold text-[var(--text)] mb-6">{t("admin.overviewTitle")}</h1>

					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						{(
							[
								{ label: t("admin.stats.totalShops"), value: allShops?.length ?? "—", icon: Building2 },
								{ label: t("admin.stats.verifiedShops"), value: verified, icon: ShieldCheck },
								{ label: t("admin.stats.totalUsers"), value: allUsers?.length ?? "—", icon: Users },
								{ label: t("admin.stats.owners"), value: owners, icon: Star },
							] as const
						).map(({ label, value, icon: Icon }) => (
							<div key={label} className="card p-4">
								<Icon size={18} className="text-[var(--gold)] mb-2" />
								<div className="text-2xl font-bold text-[var(--text)]">{value}</div>
								<div className="text-xs text-[var(--text-muted)]">{label}</div>
							</div>
						))}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="card p-5">
							<div className="flex items-center justify-between mb-4">
								<h2 className="font-bold text-[var(--text)]">{t("admin.recentShops")}</h2>
								<Link to="/admin/shops" className="text-xs text-[var(--gold)] no-underline hover:underline">{t("admin.shops.title")} →</Link>
							</div>
							{!allShops ? (
								<Skeleton className="h-32 w-full" />
							) : (
								<div className="space-y-2">
									{allShops.slice(0, 5).map((shop) => (
										<div key={shop._id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-[var(--text)] truncate">{shop.name}</div>
												<div className="text-xs text-[var(--text-muted)]">{shop.city}</div>
											</div>
											<span className={`badge text-[10px] ${shop.isVerified ? "badge-green" : "badge-gold"}`}>{shop.isVerified ? "Verified" : "Pending"}</span>
											<span className={`badge text-[10px] ${shop.isActive ? "badge-green" : "badge-red"}`}>{shop.isActive ? "Active" : "Suspended"}</span>
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
											{ role: t("admin.roles.barbers"), count: allUsers.filter((u) => u.role === "barber").length, color: "#818CF8" },
											{ role: t("admin.roles.admins"), count: allUsers.filter((u) => u.role === "admin").length, color: "var(--error)" },
										] as const
									).map(({ role, count, color }) => (
										<div key={role}>
											<div className="flex justify-between text-sm mb-1">
												<span className="text-[var(--text-muted)]">{role}</span>
												<span className="font-semibold text-[var(--text)]">{count}</span>
											</div>
											<div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
												<div className="h-full rounded-full transition-all" style={{ width: allUsers.length ? `${(count / allUsers.length) * 100}%` : "0%", background: color }} />
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
