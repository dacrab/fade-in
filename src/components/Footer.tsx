import { Link } from "@tanstack/react-router"
import { Scissors } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function Footer() {
	const { t } = useTranslation()

	return (
		<footer className="border-t border-(--border) px-4 py-8">
			<div className="page-wrap flex flex-col sm:flex-row items-center justify-between gap-4">
				<Link to="/" className="flex items-center gap-2 no-underline">
					<Scissors size={14} strokeWidth={1.5} className="text-(--gold)" />
					<span className="text-sm font-semibold text-(--text)">
						Fade<span className="text-(--gold)">In</span>
					</span>
				</Link>

				<nav className="flex items-center gap-5">
					<Link
						to="/terms"
						className="text-xs text-(--text-muted) no-underline hover:text-(--gold) transition-colors"
					>
						{t("footer.links.terms")}
					</Link>
					<Link
						to="/privacy"
						className="text-xs text-(--text-muted) no-underline hover:text-(--gold) transition-colors"
					>
						{t("footer.links.privacy")}
					</Link>
				</nav>

				<p className="text-xs text-(--text-subtle) m-0">
					{t("footer.rights", { year: new Date().getFullYear() })}
				</p>
			</div>
		</footer>
	)
}
