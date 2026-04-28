import { Link } from "@tanstack/react-router"
import { Building2, ShieldCheck, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

const NAV_LINKS = [
	{ to: "/admin/overview" as const, labelKey: "admin.overviewTitle", icon: ShieldCheck },
	{ to: "/admin/shops" as const, labelKey: "admin.shops.title", icon: Building2 },
	{ to: "/admin/users" as const, labelKey: "admin.users.title", icon: Users },
]

export default function AdminNav() {
	const { t } = useTranslation()
	return (
		<aside className="bg-card border-r border-[var(--border)] px-4 py-6 hidden md:block">
			<div className="mb-6">
				<h2 className="font-bold text-[var(--text)]">{t("admin.title")}</h2>
				<p className="text-xs text-[var(--text-muted)]">{t("admin.subtitle")}</p>
			</div>
			<nav className="space-y-1">
				{NAV_LINKS.map(({ to, labelKey, icon: Icon }) => (
					<Link
						key={to}
						to={to}
						className="sidebar-link"
						activeProps={{ className: "sidebar-link active" }}
					>
						<Icon size={16} />
						{t(labelKey)}
					</Link>
				))}
			</nav>
		</aside>
	)
}
