import { Link } from "@tanstack/react-router"
import { Globe, Scissors } from "lucide-react"
import { useTranslation } from "react-i18next"

const LINK_CLASS = "text-sm text-muted no-underline hover:text-[var(--gold)] transition-colors"

function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div>
			<h4 className="text-sm font-semibold mb-3 text-[var(--text)]">{title}</h4>
			<ul className="space-y-2 list-none p-0 m-0">{children}</ul>
		</div>
	)
}

export default function Footer() {
	const { t } = useTranslation()

	return (
		<footer className="border-t border-[var(--border)] px-4 pt-12 pb-8 mt-20">
			<div className="page-wrap">
				<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-10">
					<div>
						<Link to="/" className="flex items-center gap-2 no-underline mb-3">
							<div className="gold-gradient flex items-center justify-center w-8 h-8 rounded-lg">
								<Scissors size={16} className="text-black" />
							</div>
							<span className="font-bold text-lg text-[var(--text)]">
								Fade<span className="gold-text">In</span>
							</span>
						</Link>
						<p className="text-sm text-muted">{t("footer.tagline")}</p>
					</div>

					<FooterSection title={t("footer.discover")}>
						<li>
							<Link to="/barbershops" className={LINK_CLASS}>
								{t("nav.barbershops")}
							</Link>
						</li>
						<li>
							<Link to="/for-business" className={LINK_CLASS}>
								{t("nav.forBusiness")}
							</Link>
						</li>
					</FooterSection>

					<FooterSection title={t("footer.account")}>
						<li>
							<Link to="/login" className={LINK_CLASS}>
								{t("footer.links.login")}
							</Link>
						</li>
						<li>
							<Link to="/register" className={LINK_CLASS}>
								{t("footer.links.register")}
							</Link>
						</li>
						<li>
							<Link to="/login" className={LINK_CLASS}>
								{t("footer.links.businessLogin")}
							</Link>
						</li>
					</FooterSection>

					<FooterSection title={t("footer.company")}>
						<li>
							<a href="/about" className={LINK_CLASS}>
								{t("footer.links.about")}
							</a>
						</li>
						<li>
							<a href="/privacy" className={LINK_CLASS}>
								{t("footer.links.privacy")}
							</a>
						</li>
						<li>
							<a href="/terms" className={LINK_CLASS}>
								{t("footer.links.terms")}
							</a>
						</li>
					</FooterSection>
				</div>

				<hr className="divider mb-6" />
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-sm text-muted m-0">
						{t("footer.rights", { year: new Date().getFullYear() })}
					</p>
					<span className="text-muted p-2 rounded-lg transition-colors hover:bg-[var(--bg-card)]">
						<Globe size={18} />
					</span>
				</div>
			</div>
		</footer>
	)
}
