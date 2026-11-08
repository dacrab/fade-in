import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/privacy/")({ component: PrivacyPage })

const SECTIONS = ["collection", "usage", "sharing", "security", "rights", "contact"] as const

function PrivacyPage() {
	const { t } = useTranslation()
	return (
		<main className="page-main">
			<div className="page-wrap max-w-3xl px-5 py-10 md:px-8 md:py-14">
				<Link
					to="/"
					className="inline-flex items-center gap-1.5 text-[12px] font-medium text-(--text-muted) transition-colors hover:text-(--gold)"
				>
					<ArrowLeft size={14} />
					{t("common.back")}
				</Link>

				<header className="mt-8 border-b border-(--border) pb-7">
					<p className="eyebrow">{t("legal.eyebrow")}</p>
					<h1 className="display display-sm mt-4 text-(--text)">{t("legal.privacyTitle")}</h1>
					<p className="mt-3 text-[13px] text-(--text-subtle)">
						{t("legal.lastUpdated", { date: "2026-01-01" })}
					</p>
				</header>

				<div className="mt-9 space-y-9">
					{SECTIONS.map((s, i) => (
						<section
							key={s}
							className="grid gap-3 border-b border-(--border) pb-8 last:border-0 md:grid-cols-[auto_1fr] md:gap-6"
						>
							<span className="font-serif text-[1.05rem] font-medium italic leading-none text-(--gold)">
								{String(i + 1).padStart(2, "0")}
							</span>
							<div>
								<h2 className="font-serif text-[1.3rem] font-medium tracking-[-0.02em] text-(--text)">
									{t(`legal.privacy.${s}.title`)}
								</h2>
								<p className="mt-2 text-sm leading-relaxed text-(--text-muted)">
									{t(`legal.privacy.${s}.body`)}
								</p>
							</div>
						</section>
					))}
				</div>
			</div>
		</main>
	)
}
