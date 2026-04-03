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

export default function Header() {
	const [mobileOpen, setMobileOpen] = useState(false)
	const { user, logout } = useAuth()
	const router = useRouter()
	const { t } = useTranslation()

	const handleLogout = () => {
		logout()
		void router.navigate({ to: "/" })
	}

	const ROLE_NAV: Partial<
		Record<"customer" | "owner" | "admin", { label: string; icon: React.ReactNode; to: string }>
	> = {
		customer: { label: t("nav.dashboard"), icon: <LayoutDashboard size={14} />, to: "/dashboard" },
		owner: { label: t("nav.business"), icon: <Building2 size={14} />, to: "/business" },
		admin: { label: t("nav.admin"), icon: <ShieldCheck size={14} />, to: "/admin" },
	}

	const roleItem = user && ROLE_NAV[user.role]
	const userMenuItems = [
		...(roleItem
			? [
					{
						label: roleItem.label,
						icon: roleItem.icon,
						onClick: () => void router.navigate({ to: roleItem.to }),
					},
				]
			: []),
		{ separator: true as const, label: "" },
		{ label: t("common.signOut"), icon: <LogOut size={14} />, onClick: handleLogout, danger: true },
	]

	return (
		<header className="sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-lg bg-[var(--header-bg)]">
			<nav className="page-wrap px-4 flex items-center gap-4 h-16">
				<Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
					<div className="gold-gradient flex items-center justify-center w-8 h-8 rounded-lg">
						<Scissors size={16} className="text-black" />
					</div>
					<span className="font-bold text-lg tracking-tight text-[var(--text)]">
						Fade<span className="gold-text">In</span>
					</span>
				</Link>

				<div className="hidden md:flex items-center gap-1 ml-4">
					<Link to="/" className="nav-link" activeProps={{ className: "nav-link active" }}>
						{t("nav.home")}
					</Link>
					<Link to="/barbershops" className="nav-link" activeProps={{ className: "nav-link active" }}>
						{t("nav.barbershops")}
					</Link>
					<Link to="/for-business" className="nav-link" activeProps={{ className: "nav-link active" }}>
						{t("nav.forBusiness")}
					</Link>
				</div>

				<div className="flex items-center gap-2 ml-auto">
					{user ? (
						<Menu
							align="end"
							trigger={
								<button
									type="button"
									className="bg-card flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors text-sm cursor-pointer"
								>
									<div className="avatar avatar-sm">{user.name.charAt(0).toUpperCase()}</div>
									<span className="hidden sm:block text-[var(--text)]">{user.name}</span>
								</button>
							}
							items={userMenuItems}
						/>
					) : (
						<div className="flex items-center gap-2">
							<Link to="/login" className="btn btn-ghost text-sm px-4 py-2">
								{t("common.signIn")}
							</Link>
							<Link to="/register" className="btn btn-primary text-sm px-4 py-2">
								{t("common.getStarted")}
							</Link>
						</div>
					)}

					<LanguageToggle />

					<button
						type="button"
						className="md:hidden icon-btn btn-bare"
						onClick={() => setMobileOpen(!mobileOpen)}
					>
						{mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
					</button>
				</div>
			</nav>

			{mobileOpen && (
				<div className="md:hidden bg-card border-t border-[var(--border)] px-4 py-4 flex flex-col gap-2">
					<Link to="/" className="nav-link" onClick={() => setMobileOpen(false)}>
						{t("nav.home")}
					</Link>
					<Link to="/barbershops" className="nav-link" onClick={() => setMobileOpen(false)}>
						{t("nav.barbershops")}
					</Link>
					<Link to="/for-business" className="nav-link" onClick={() => setMobileOpen(false)}>
						{t("nav.forBusiness")}
					</Link>
					{user ? (
						<>
							<hr className="divider my-1" />
							{user.role === "customer" && (
								<Link to="/dashboard" className="nav-link" onClick={() => setMobileOpen(false)}>
									{t("nav.dashboard")}
								</Link>
							)}
							{user.role === "owner" && (
								<Link to="/business" className="nav-link" onClick={() => setMobileOpen(false)}>
									{t("nav.business")}
								</Link>
							)}
							{user.role === "admin" && (
								<Link to="/admin" className="nav-link" onClick={() => setMobileOpen(false)}>
									{t("nav.admin")}
								</Link>
							)}
							<button
								type="button"
								onClick={() => {
									handleLogout()
									setMobileOpen(false)
								}}
								className="nav-link text-left text-[var(--error)] btn-bare"
							>
								{t("common.signOut")}
							</button>
						</>
					) : (
						<>
							<hr className="divider my-1" />
							<Link to="/login" className="nav-link" onClick={() => setMobileOpen(false)}>
								{t("common.signIn")}
							</Link>
							<Link
								to="/register"
								className="btn btn-primary justify-center mt-1"
								onClick={() => setMobileOpen(false)}
							>
								{t("common.getStarted")}
							</Link>
						</>
					)}
				</div>
			)}
		</header>
	)
}
