import { Link } from "@tanstack/react-router"
import { Building2, Calendar, ShieldCheck, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

const NAV_LINKS = [
	{ to: "/admin/overview" as const, labelKey: "admin.overviewTitle", icon: ShieldCheck },
	{ to: "/admin/shops" as const, labelKey: "admin.shops.title", icon: Building2 },
	{ to: "/admin/users" as const, labelKey: "admin.users.title", icon: Users },
	{ to: "/admin/appointments" as const, labelKey: "admin.appointments.title", icon: Calendar },
]

const NAV_ITEM = "side-nav-item"
const NAV_ITEM_ACTIVE = "is-active"

export default function AdminNav() {
	const { t } = useTranslation()
	return (
		<div className="w-full flex-shrink-0 md:w-64">
			<div className="border-b border-(--border) md:hidden">
				<nav className="flex gap-1 overflow-x-auto px-3 py-2.5 scrollbar-hide">
					{NAV_LINKS.map(({ to, labelKey, icon: Icon }) => (
						<Link key={to} to={to} className="mobile-nav-item" activeProps={{ className: "is-active" }}>
							<Icon size={13} />
							{t(labelKey)}
						</Link>
					))}
				</nav>
			</div>

			<aside className="hidden flex-col border-r border-(--border) px-5 py-8 md:sticky md:top-(--header-height) md:flex md:h-[calc(100vh-var(--header-height))] md:overflow-y-auto">
				<div className="mb-6 px-3">
					<p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-(--text-subtle)">
						{t("admin.subtitle")}
					</p>
					<h2 className="mt-2 font-serif text-[1.35rem] font-medium tracking-[-0.02em] text-(--text)">
						{t("admin.title")}
					</h2>
				</div>
				<nav className="space-y-0.5">
					{NAV_LINKS.map(({ to, labelKey, icon: Icon }) => (
						<Link key={to} to={to} className={NAV_ITEM} activeProps={{ className: NAV_ITEM_ACTIVE }}>
							<Icon size={15} strokeWidth={1.7} />
							{t(labelKey)}
						</Link>
					))}
				</nav>
			</aside>
		</div>
	)
}
