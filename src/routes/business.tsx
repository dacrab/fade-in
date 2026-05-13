import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { BarChart3, Calendar, Check, MessageSquare, Scissors, Settings, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useBusinessAuth } from "#/hooks/useBusinessAuth"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import type { Barbershop } from "#/types"

export const Route = createFileRoute("/business")({ component: BusinessLayout })

const NAV_LINK_DEFS = [
	{ to: "/business/overview", key: "overview", icon: BarChart3 },
	{ to: "/business/appointments", key: "appointments", icon: Calendar },
	{ to: "/business/services", key: "services", icon: Scissors },
	{ to: "/business/barbers", key: "barbers", icon: Users },
	{ to: "/business/reviews", key: "reviews", icon: MessageSquare },
	{ to: "/business/profile", key: "profile", icon: Settings },
] as const

function BusinessLayout() {
	const { t } = useTranslation()
	const { user } = useBusinessAuth()
	const shop = useOwnerShop(user?.id) as Barbershop | undefined

	return (
		<div className="flex flex-1">
			{/* Persistent sidebar */}
			<aside className="w-56 flex-shrink-0 hidden md:flex flex-col py-8 px-5 border-r border-(--border)">
				{shop && (
					<div className="mb-5">
						<h2 className="text-sm font-medium text-(--text) truncate">{shop.name}</h2>
						<p className="text-xs text-(--text-muted) mt-0.5">{shop.city}</p>
						{shop.isVerified && (
							<span className="inline-flex items-center gap-1 text-[10px] text-(--gold) mt-1.5">
								<Check size={9} /> {t("common.verified")}
							</span>
						)}
					</div>
				)}
				<nav className="space-y-0.5">
					{NAV_LINK_DEFS.map(({ to, key, icon: Icon }) => (
						<Link
							key={to}
							to={to}
							className="flex items-center gap-2.5 px-3 py-2 text-sm text-(--text-muted) hover:text-(--text) transition-colors rounded-md"
							activeProps={{
								className:
									"flex items-center gap-2.5 px-3 py-2 text-sm text-(--text) font-medium rounded-md relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-4 before:bg-(--gold) before:rounded-full",
							}}
						>
							<Icon size={15} />
							{t(`business.nav.${key}`)}
						</Link>
					))}
				</nav>
			</aside>

			{/* Page content */}
			<div className="flex-1 overflow-auto">
				<Outlet />
			</div>
		</div>
	)
}
