import { Link } from "@tanstack/react-router"
import { Facebook, Globe, Instagram } from "lucide-react"
import { useTranslation } from "react-i18next"
import Logo from "./Logo"

export default function Footer() {
	const { t } = useTranslation()
	const year = new Date().getFullYear()
	const linkCls = "text-sm text-muted no-underline hover:text-[var(--gold)] transition-colors"

	return (
		<footer className="border-t border-[var(--border)] px-4 pt-12 pb-8 mt-20">
			<div className="page-wrap">
				<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-10">
					<div>
						<div className="mb-3">
							<Logo />
						</div>
						<p className="text-sm text-muted">{t("footer.tagline")}</p>
					</div>

					<div>
						<h4 className="text-sm font-semibold mb-3 text-[var(--text)]">{t("footer.discover")}</h4>
						<ul className="space-y-2 list-none p-0 m-0">
							<li>
								<Link to="/barbershops" className={linkCls}>
									{t("nav.barbershops")}
								</Link>
							</li>
							<li>
								<Link to="/for-business" className={linkCls}>
									{t("nav.forBusiness")}
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-sm font-semibold mb-3 text-[var(--text)]">{t("footer.account")}</h4>
						<ul className="space-y-2 list-none p-0 m-0">
							<li>
								<Link to="/login" className={linkCls}>
									{t("footer.links.login")}
								</Link>
							</li>
							<li>
								<Link to="/register" className={linkCls}>
									{t("footer.links.register")}
								</Link>
							</li>
							<li>
								<Link to="/login" className={linkCls}>
									{t("footer.links.businessLogin")}
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-sm font-semibold mb-3 text-[var(--text)]">{t("footer.company")}</h4>
						<ul className="space-y-2 list-none p-0 m-0">
							<li>
								<a href="/about" className={linkCls}>
									{t("footer.links.about")}
								</a>
							</li>
							<li>
								<a href="/privacy" className={linkCls}>
									{t("footer.links.privacy")}
								</a>
							</li>
							<li>
								<a href="/terms" className={linkCls}>
									{t("footer.links.terms")}
								</a>
							</li>
						</ul>
					</div>
				</div>

				<hr className="divider mb-6" />
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-sm text-muted m-0">{t("footer.rights", { year })}</p>
					<div className="flex items-center gap-2">
						{([Instagram, Facebook, Globe] as const).map((Icon) => (
							<span
								key={Icon.displayName}
								className="text-muted p-2 rounded-lg transition-colors hover:bg-[var(--bg-card)]"
							>
								<Icon size={18} />
							</span>
						))}
					</div>
				</div>
			</div>
		</footer>
	)
}
