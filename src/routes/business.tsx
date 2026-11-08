import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { BarChart3, Calendar, Check, MessageSquare, Scissors, Settings, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useOwnerShop } from "#/hooks/useOwnerShop"
import { OWNER_ADMIN_ROLES, useRequireRole } from "#/hooks/useRequireRole"

export const Route = createFileRoute("/business")({ component: BusinessLayout })

const NAV_LINK_DEFS = [
	{ to: "/business/overview", key: "overview", icon: BarChart3 },
	{ to: "/business/appointments", key: "appointments", icon: Calendar },
	{ to: "/business/services", key: "services", icon: Scissors },
	{ to: "/business/barbers", key: "barbers", icon: Users },
	{ to: "/business/reviews", key: "reviews", icon: MessageSquare },
	{ to: "/business/profile", key: "profile", icon: Settings },
] as const

const NAV_ITEM =
	"flex shrink-0 items-center gap-2.5 rounded-(--radius) border-l-2 border-transparent px-3 py-2 text-[13px] font-medium text-(--text-muted) transition-colors hover:bg-(--bg-input) hover:text-(--text)"
const NAV_ITEM_ACTIVE =
	"flex shrink-0 items-center gap-2.5 rounded-(--radius) border-l-2 border-(--gold) bg-(--gold)/7 px-3 py-2 text-[13px] font-medium text-(--text)"

function BusinessLayout() {
	const { t } = useTranslation()
	const { user } = useRequireRole(OWNER_ADMIN_ROLES, true)
	const { shop } = useOwnerShop(Boolean(user))

	return (
		<div className="flex flex-1 flex-col md:flex-row">
			<aside className="hidden w-64 flex-shrink-0 flex-col border-r border-(--border) px-5 py-8 md:sticky md:top-(--header-height) md:flex md:h-[calc(100vh-var(--header-height))] md:overflow-y-auto">
				<div className="mb-6 px-3">
					<p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-(--text-subtle)">
						{t("nav.business")}
					</p>
					{shop ? (
						<>
							<h2 className="mt-2 truncate font-serif text-[1.25rem] font-medium tracking-[-0.02em] text-(--text)">
								{shop.name}
							</h2>
							<p className="mt-0.5 text-xs text-(--text-muted)">{shop.city}</p>
							{shop.isVerified && (
								<span className="mt-2 inline-flex items-center gap-1 rounded-(--radius-sm) border border-(--gold)/20 bg-(--gold)/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-(--gold)">
									<Check size={9} /> {t("common.verified")}
								</span>
							)}
						</>
					) : (
						<h2 className="mt-2 font-serif text-[1.25rem] font-medium tracking-[-0.02em] text-(--text)">
							{t("business.setupTitle")}
						</h2>
					)}
				</div>

				<nav className="space-y-0.5">
					{NAV_LINK_DEFS.map(({ to, key, icon: Icon }) => (
						<Link key={to} to={to} className={NAV_ITEM} activeProps={{ className: NAV_ITEM_ACTIVE }}>
							<Icon size={15} strokeWidth={1.7} />
							{t(`business.nav.${key}`)}
						</Link>
					))}
				</nav>

				{shop && (
					<div className="mt-auto border-t border-(--border) pt-4">
						<Link
							to="/barbershops/$slug"
							params={{ slug: shop.slug }}
							className="flex items-center gap-2 px-3 py-2 text-[11.5px] text-(--text-muted) transition-colors hover:text-(--gold)"
						>
							{t("business.viewPublic")}
						</Link>
					</div>
				)}
			</aside>

			<div className="border-b border-(--border) bg-(--bg) md:hidden">
				<nav className="flex gap-1 overflow-x-auto px-3 py-2.5 scrollbar-hide">
					{NAV_LINK_DEFS.map(({ to, key, icon: Icon }) => (
						<Link
							key={to}
							to={to}
							className="flex shrink-0 items-center gap-1.5 rounded-(--radius) px-2.5 py-2 text-[11.5px] font-medium text-(--text-muted) transition-colors hover:bg-(--bg-input) hover:text-(--text)"
							activeProps={{
								className:
									"flex shrink-0 items-center gap-1.5 rounded-(--radius) bg-(--ink) px-2.5 py-2 text-[11.5px] font-medium text-(--bg)",
							}}
						>
							<Icon size={13} />
							{t(`business.nav.${key}`)}
						</Link>
					))}
				</nav>
			</div>

			<div className="min-w-0 flex-1 overflow-auto">
				<Outlet />
			</div>
		</div>
	)
}
