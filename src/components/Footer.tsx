import { Link } from "@tanstack/react-router"
import { ArrowUpRight, Scissors } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function Footer() {
	const { t } = useTranslation()

	return (
		<footer className="border-t border-(--border) bg-(--bg)">
			<div className="page-wrap px-5 md:px-8 py-12 md:py-16">
				<div className="grid gap-10 md:grid-cols-12">
					<div className="md:col-span-6">
						<Link to="/" className="inline-flex items-center gap-2.5 no-underline">
							<span className="flex h-8 w-8 items-center justify-center rounded-(--radius) bg-(--gold) text-[#fffaf5]">
								<Scissors size={15} strokeWidth={1.7} />
							</span>
							<span className="font-serif text-[1.3rem] font-medium leading-none tracking-[-0.03em] text-(--text)">
								Fade<span className="text-(--gold)">In</span>
							</span>
						</Link>
						<p className="mt-4 max-w-xs font-serif text-[1.35rem] leading-[1.3] tracking-[-0.02em] text-(--text-muted)">
							{t("footer.tagline")}
						</p>
					</div>

					<div className="md:col-span-3">
						<p className="eyebrow eyebrow-plain mb-4">{t("footer.explore")}</p>
						<nav className="flex flex-col gap-2.5">
							<Link to="/" className="footer-link">
								{t("nav.home")}
							</Link>
							<Link to="/barbershops/listing" className="footer-link">
								{t("nav.barbershops")}
							</Link>
							<Link to="/for-business" className="footer-link">
								{t("nav.forBusiness")}
							</Link>
						</nav>
					</div>

					<div className="md:col-span-3">
						<p className="eyebrow eyebrow-plain mb-4">{t("footer.account")}</p>
						<nav className="flex flex-col gap-2.5">
							<Link to="/login" className="footer-link">
								{t("common.signIn")}
							</Link>
							<Link to="/register" className="footer-link">
								{t("common.createAccount")}
							</Link>
							<Link to="/terms" className="footer-link inline-flex items-center gap-1">
								{t("footer.links.terms")} <ArrowUpRight size={12} />
							</Link>
							<Link to="/privacy" className="footer-link inline-flex items-center gap-1">
								{t("footer.links.privacy")} <ArrowUpRight size={12} />
							</Link>
						</nav>
					</div>
				</div>

				<div className="mt-12 flex flex-col gap-3 border-t border-(--border) pt-5 sm:flex-row sm:items-center sm:justify-between">
					<p className="subtle-xs m-0">{t("footer.rights", { year: new Date().getFullYear() })}</p>
					<p className="subtle-xs m-0 font-medium tracking-[0.04em]">{t("footer.madeFor")}</p>
				</div>
			</div>
		</footer>
	)
}
