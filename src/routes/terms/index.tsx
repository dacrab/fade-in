import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/terms/")({ component: TermsPage })

function TermsPage() {
	const { t } = useTranslation()

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl py-8">
				<Link to="/" className="text-sm text-(--text-muted) hover:text-(--gold) mb-6 inline-block">
					← {t("common.back")}
				</Link>
				<h1 className="text-3xl font-bold text-(--text) mb-2">{t("legal.termsTitle")}</h1>
				<p className="text-sm text-(--text-muted) mb-5">
					{t("legal.lastUpdated", { date: "2026-01-01" })}
				</p>

				<div className="space-y-6 text-sm text-(--text-muted) leading-relaxed">
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.terms.acceptance.title")}
						</h2>
						<p>{t("legal.terms.acceptance.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.terms.services.title")}
						</h2>
						<p>{t("legal.terms.services.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.terms.accounts.title")}
						</h2>
						<p>{t("legal.terms.accounts.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.terms.bookings.title")}
						</h2>
						<p>{t("legal.terms.bookings.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.terms.liability.title")}
						</h2>
						<p>{t("legal.terms.liability.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.terms.changes.title")}
						</h2>
						<p>{t("legal.terms.changes.body")}</p>
					</section>
				</div>
			</div>
		</main>
	)
}
