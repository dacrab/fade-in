import { useClerk } from "@clerk/tanstack-react-start"
import { Link, useRouter } from "@tanstack/react-router"
import {
	Building2,
	LayoutDashboard,
	LogOut,
	Menu as MenuIcon,
	Scissors,
	ShieldCheck,
	X,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "#/hooks/useAuth"
import BrandMark from "./BrandMark"
import LanguageToggle from "./LanguageToggle"
import { Menu } from "./ui/Menu"

const ROLE_NAV = {
	customer: {
		labelKey: "nav.dashboard",
		icon: <LayoutDashboard size={14} />,
		to: "/dashboard/overview",
	},
	barber: { labelKey: "nav.barber", icon: <Scissors size={14} />, to: "/barber/overview" },
	owner: { labelKey: "nav.business", icon: <Building2 size={14} />, to: "/business/overview" },
	admin: { labelKey: "nav.admin", icon: <ShieldCheck size={14} />, to: "/admin/overview" },
} as const

const NAV_LINK =
	"relative py-2 text-[13px] font-medium text-(--text-muted) transition-colors duration-200 hover:text-(--text) after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-(--gold) after:transition-all after:duration-300 hover:after:w-full"
const NAV_LINK_ACTIVE =
	"relative py-2 text-[13px] font-medium text-(--text) after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-(--gold)"

const NAV_ITEMS = [
	{ to: "/" as const, key: "nav.home" },
	{ to: "/barbershops/listing" as const, key: "nav.barbershops" },
	{ to: "/for-business" as const, key: "nav.forBusiness" },
]

export default function Header() {
	const [mobileOpen, setMobileOpen] = useState(false)
	const { signOut } = useClerk()
	const { user } = useAuth()
	const router = useRouter()
	const { t } = useTranslation()

	const handleLogout = () => signOut()

	const roleItem = user ? ROLE_NAV[user.role] : undefined
	const userMenuItems = [
		...(roleItem
			? [
					{
						id: "role-nav",
						label: t(roleItem.labelKey),
						icon: roleItem.icon,
						onClick: () => void router.navigate({ to: roleItem.to }),
					},
				]
			: []),
		{ id: "sep", separator: true as const },
		{
			id: "logout",
			label: t("common.signOut"),
			icon: <LogOut size={14} />,
			onClick: handleLogout,
			danger: true,
		},
	]

	return (
		<>
			<header className="sticky top-0 z-50 border-b border-(--border) bg-(--header-bg) backdrop-blur-md">
				<nav className="page-wrap px-5 md:px-8 flex items-center justify-between h-18">
					<Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0 group">
						<BrandMark
							size={36}
							className="shadow-[0_1px_2px_rgba(143,50,32,0.2)] transition-transform duration-300 group-hover:-rotate-6"
						/>
						<span className="font-serif text-[1.35rem] font-medium leading-none tracking-[-0.03em] text-(--text)">
							Fade<span className="italic text-(--gold)">In</span>
						</span>
					</Link>

					<div className="hidden md:flex items-center gap-8">
						{NAV_ITEMS.map(({ to, key }) => (
							<Link key={to} to={to} className={NAV_LINK} activeProps={{ className: NAV_LINK_ACTIVE }}>
								{t(key)}
							</Link>
						))}
					</div>

					<div className="flex items-center gap-2.5">
						{user ? (
							<Menu
								trigger={
									<button
										type="button"
										aria-label={user.name ?? user.email}
										className="flex items-center gap-2 rounded-full p-1 pr-1 transition-colors hover:bg-(--bg-input) cursor-pointer md:pr-3"
									>
										<span className="w-8 h-8 rounded-full bg-(--ink) text-(--bg) flex items-center justify-center text-xs font-medium">
											{(user.name ?? user.email)?.[0]?.toUpperCase() ?? "?"}
										</span>
										<span className="hidden md:block main-sm font-medium max-w-[9rem] truncate">
											{user.name ?? user.email}
										</span>
									</button>
								}
								items={userMenuItems}
							/>
						) : (
							<div className="hidden md:flex items-center gap-4">
								<Link
									to="/login"
									className="text-[13px] font-medium text-(--text-muted) hover:text-(--text) transition-colors duration-200"
								>
									{t("common.signIn")}
								</Link>
								<Link to="/register" className="btn btn-primary btn-sm">
									{t("common.getStarted")}
								</Link>
							</div>
						)}
						<LanguageToggle />
						<button
							type="button"
							aria-label={t("common.openMenu")}
							aria-expanded={mobileOpen}
							className="md:hidden flex h-9 w-9 items-center justify-center rounded-(--radius) border border-(--border) bg-(--bg-card) text-(--text) transition-colors hover:border-(--border-hover)"
							onClick={() => setMobileOpen((o) => !o)}
						>
							{mobileOpen ? <X size={18} /> : <MenuIcon size={18} />}
						</button>
					</div>
				</nav>
			</header>

			{mobileOpen && (
				<div className="fixed top-(--header-height) left-0 right-0 bottom-0 z-[60] bg-(--bg) md:hidden fade-in overflow-y-auto">
					<div className="flex flex-col px-6 py-8">
						{NAV_ITEMS.map(({ to, key }, i) => (
							<Link
								key={to}
								to={to}
								className="border-b border-(--border) py-4 font-serif text-[1.75rem] font-medium tracking-[-0.025em] text-(--text)"
								onClick={() => setMobileOpen(false)}
								style={{ animationDelay: `${i * 40}ms` }}
							>
								{t(key)}
							</Link>
						))}
						<div className="mt-8 flex flex-col gap-3">
							{user ? (
								<>
									{roleItem && (
										<Link
											to={roleItem.to}
											className="btn btn-secondary w-full"
											onClick={() => setMobileOpen(false)}
										>
											{t(roleItem.labelKey)}
										</Link>
									)}
									<button
										type="button"
										onClick={() => {
											handleLogout()
											setMobileOpen(false)
										}}
										className="btn btn-ghost w-full text-(--error)"
									>
										{t("common.signOut")}
									</button>
								</>
							) : (
								<>
									<Link
										to="/login"
										className="btn btn-secondary w-full"
										onClick={() => setMobileOpen(false)}
									>
										{t("common.signIn")}
									</Link>
									<Link
										to="/register"
										className="btn btn-primary w-full"
										onClick={() => setMobileOpen(false)}
									>
										{t("common.getStarted")}
									</Link>
								</>
							)}
						</div>
						<p className="eyebrow mt-10">{t("footer.tagline")}</p>
					</div>
				</div>
			)}
		</>
	)
}
