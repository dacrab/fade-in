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
		<aside className="px-4 py-6 hidden md:block">
			<div className="mb-6">
				<h2 className="font-semibold text-(--text)">{t("admin.title")}</h2>
				<p className="text-xs text-(--text-muted)">{t("admin.subtitle")}</p>
			</div>
			<nav className="space-y-0.5">
				{NAV_LINKS.map(({ to, labelKey, icon: Icon }) => (
					<Link
						key={to}
						to={to}
						className="flex items-center gap-2.5 px-3 py-2 text-sm text-(--text-muted) rounded-lg border-l-2 border-transparent transition-colors hover:text-(--text) hover:bg-(--bg-input)"
						activeProps={{
							className:
								"flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg border-l-2 border-(--gold) text-(--text) bg-(--bg-input)",
						}}
					>
						<Icon size={16} />
						{t(labelKey)}
					</Link>
				))}
			</nav>
		</aside>
	)
}
