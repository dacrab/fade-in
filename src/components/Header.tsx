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
	"relative text-sm font-medium text-(--text-muted) hover:text-(--gold) transition-colors duration-200 py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-(--gold) after:transition-all after:duration-200 hover:after:w-full"
const NAV_LINK_ACTIVE =
	"relative text-sm font-medium text-(--gold) py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1.5px] after:bg-(--gold)"

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
			<header className="sticky top-0 z-50 border-b border-(--border) bg-(--bg)">
				<nav className="page-wrap px-6 md:px-10 flex items-center justify-between h-18">
					<Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0 group">
						<Scissors
							size={20}
							strokeWidth={1.5}
							className="text-(--gold) transition-transform duration-300 group-hover:rotate-[-12deg]"
						/>
						<span className="font-semibold text-[1.1rem] tracking-tight text-(--text)">
							Fade<span className="text-(--gold)">In</span>
						</span>
					</Link>

					<div className="hidden md:flex items-center gap-8">
						{NAV_ITEMS.map(({ to, key }) => (
							<Link key={to} to={to} className={NAV_LINK} activeProps={{ className: NAV_LINK_ACTIVE }}>
								{t(key)}
							</Link>
						))}
					</div>

					<div className="flex items-center gap-3">
						{user ? (
							<Menu
								trigger={
									<button
										type="button"
										aria-label={user.name ?? user.email}
										className="flex items-center gap-2 py-1.5 px-1 rounded-full hover:opacity-80 transition-opacity duration-200 cursor-pointer"
									>
										<div className="w-8 h-8 rounded-full bg-(--gold) text-white flex items-center justify-center text-xs font-medium">
											{(user.name ?? user.email)?.[0]?.toUpperCase() ?? "?"}
										</div>
										<span className="hidden sm:block main-sm font-medium">{user.name ?? user.email}</span>
									</button>
								}
								items={userMenuItems}
							/>
						) : (
							<div className="hidden md:flex items-center gap-4">
								<Link
									to="/login"
									className="text-sm font-medium text-(--text-muted) hover:text-(--gold) transition-colors duration-200"
								>
									{t("common.signIn")}
								</Link>
								<Link to="/register" className="btn btn-primary text-sm">
									{t("common.getStarted")}
								</Link>
							</div>
						)}
						<LanguageToggle />
						<button
							type="button"
							aria-label={t("common.openMenu")}
							aria-expanded={mobileOpen}
							className="md:hidden p-2 text-(--text) hover:text-(--gold) transition-colors"
							onClick={() => setMobileOpen((o) => !o)}
						>
							{mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
						</button>
					</div>
				</nav>
			</header>

			{mobileOpen && (
				<div className="fixed top-(--header-height) left-0 right-0 z-[60] bg-(--bg) border-b border-(--border) shadow-sm md:hidden">
					<div className="flex flex-col px-6 py-6 gap-4">
						{NAV_ITEMS.map(({ to, key }) => (
							<Link key={to} to={to} className="nav-link" onClick={() => setMobileOpen(false)}>
								{t(key)}
							</Link>
						))}
						{user ? (
							<>
								<div className="w-full h-px bg-(--border)" />
								{roleItem && (
									<Link to={roleItem.to} className="nav-link" onClick={() => setMobileOpen(false)}>
										{t(roleItem.labelKey)}
									</Link>
								)}
								<button
									type="button"
									onClick={() => {
										handleLogout()
										setMobileOpen(false)
									}}
									className="text-base font-medium text-(--error) transition-colors py-2 text-left"
								>
									{t("common.signOut")}
								</button>
							</>
						) : (
							<>
								<div className="w-full h-px bg-(--border)" />
								<Link to="/login" className="nav-link" onClick={() => setMobileOpen(false)}>
									{t("common.signIn")}
								</Link>
								<Link
									to="/register"
									className="btn btn-primary w-full justify-center"
									onClick={() => setMobileOpen(false)}
								>
									{t("common.getStarted")}
								</Link>
							</>
						)}
					</div>
				</div>
			)}
		</>
	)
}
