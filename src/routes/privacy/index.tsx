import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/privacy/")({ component: PrivacyPage })

function PrivacyPage() {
	const { t } = useTranslation()

	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl py-8">
				<Link to="/" className="text-sm text-(--text-muted) hover:text-(--gold) mb-6 inline-block">
					← {t("common.back")}
				</Link>
				<h1 className="text-3xl font-bold text-(--text) mb-2">{t("legal.privacyTitle")}</h1>
				<p className="text-sm text-(--text-muted) mb-5">
					{t("legal.lastUpdated", { date: "2026-01-01" })}
				</p>

				<div className="space-y-6 text-sm text-(--text-muted) leading-relaxed">
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.privacy.collection.title")}
						</h2>
						<p>{t("legal.privacy.collection.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.privacy.usage.title")}
						</h2>
						<p>{t("legal.privacy.usage.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.privacy.sharing.title")}
						</h2>
						<p>{t("legal.privacy.sharing.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.privacy.security.title")}
						</h2>
						<p>{t("legal.privacy.security.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.privacy.rights.title")}
						</h2>
						<p>{t("legal.privacy.rights.body")}</p>
					</section>
					<section>
						<h2 className="text-base font-semibold text-(--text) mb-2">
							{t("legal.privacy.contact.title")}
						</h2>
						<p>{t("legal.privacy.contact.body")}</p>
					</section>
				</div>
			</div>
		</main>
	)
}
