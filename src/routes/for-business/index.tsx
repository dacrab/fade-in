import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight, BarChart3, Calendar, Star, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute("/for-business/")({ component: ForBusinessPage })

function ForBusinessPage() {
	const { t } = useTranslation()

	const features = [
		{ icon: Calendar, key: "calendar" },
		{ icon: Users, key: "team" },
		{ icon: BarChart3, key: "analytics" },
		{ icon: Star, key: "reviews" },
	] as const

	return (
		<main>
			<section className="px-4 pt-16 pb-12">
				<div className="page-wrap max-w-4xl">
					<p className="text-[11px] text-(--gold) font-medium mb-6 fade-up">{t("forBusiness.badge")}</p>
					<h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-(--text) mb-4 fade-up [animation-delay:60ms]">
						{t("forBusiness.title")}
						<br />
						<span className="text-(--gold)">{t("forBusiness.titleHighlight")}</span>
					</h1>
					<p className="text-lg text-(--text-muted) max-w-xl mb-6 leading-relaxed fade-up [animation-delay:120ms]">
						{t("forBusiness.subtitle")}
					</p>
					<div className="flex gap-3 fade-up [animation-delay:180ms]">
						<Link to="/register" search={{ role: "owner" }} className="btn btn-primary px-8 py-3">
							{t("common.getStarted")} <ArrowRight size={16} />
						</Link>
						<Link to="/login" className="btn btn-ghost px-6 py-3">
							{t("common.signIn")}
						</Link>
					</div>
				</div>
			</section>

			<section className="px-4 py-8 border-t border-white/6">
				<div className="page-wrap max-w-4xl">
					<p className="text-[11px] text-(--text-muted) font-medium mb-3">
						{t("forBusiness.featuresTitle")}
					</p>
					<p className="text-(--text-muted) text-sm mb-6">{t("forBusiness.featuresSubtitle")}</p>

					<div className="space-y-4">
						{features.map(({ icon: Icon, key }, i) => (
							<div
								key={key}
								className="flex gap-6 items-start group py-6 border-b border-white/4 last:border-0"
							>
								<span className="text-4xl font-bold text-white/6 leading-none shrink-0 w-12">
									{String(i + 1).padStart(2, "0")}
								</span>
								<div className="flex-1">
									<h3 className="font-semibold text-(--text) mb-1 flex items-center gap-2">
										<Icon size={16} className="text-(--gold) opacity-70" />
										{t(`forBusiness.features.${key}.title`)}
									</h3>
									<p className="text-sm text-(--text-muted) leading-relaxed">
										{t(`forBusiness.features.${key}.desc`)}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
	)
}
