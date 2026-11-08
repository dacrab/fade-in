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
			<section className="border-b border-(--border)">
				<div className="page-wrap px-5 md:px-8 py-12 md:py-20">
					<div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
						<div>
							<p className="eyebrow fade-up">{t("forBusiness.badge")}</p>
							<h1 className="display display-md mt-6 text-(--text) fade-up [animation-delay:60ms]">
								{t("forBusiness.title")}
								<br />
								<span className="italic text-(--gold)">{t("forBusiness.titleHighlight")}</span>
							</h1>
							<p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-(--text-muted) fade-up [animation-delay:120ms]">
								{t("forBusiness.subtitle")}
							</p>
							<div className="mt-8 flex flex-wrap gap-3 fade-up [animation-delay:180ms]">
								<Link to="/register" search={{ role: "owner" }} className="btn btn-primary btn-lg">
									{t("common.getStarted")} <ArrowRight size={16} />
								</Link>
								<Link to="/login" className="btn btn-secondary btn-lg">
									{t("common.signIn")}
								</Link>
							</div>
						</div>

						<div className="relative fade-up [animation-delay:120ms]">
							<div className="image-frame aspect-[4/3] max-h-[480px] w-full">
								<picture className="contents">
									<source
										type="image/webp"
										srcSet="/images/for-business-600.webp 600w, /images/for-business-1000.webp 1000w"
										sizes="(min-width: 1024px) 45vw, 100vw"
									/>
									<img
										src="/images/for-business.jpg"
										alt={t("forBusiness.imageAlt")}
										className="h-full w-full object-cover"
										width={1400}
										height={1050}
										loading="eager"
										decoding="async"
									/>
								</picture>
								<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
								<p className="absolute inset-x-5 bottom-5 max-w-xs font-serif text-[1.35rem] leading-tight text-white">
									{t("forBusiness.heroCaption")}
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section>
				<div className="page-wrap px-5 md:px-8 py-14 md:py-20">
					<div className="mb-10 grid gap-3 border-b border-(--border) pb-8 md:grid-cols-2 md:items-end">
						<div>
							<p className="eyebrow">{t("forBusiness.toolkitEyebrow")}</p>
							<h2 className="display display-sm mt-3">{t("forBusiness.featuresTitle")}</h2>
						</div>
						<p className="text-sm leading-relaxed text-(--text-muted) md:justify-self-end md:max-w-sm">
							{t("forBusiness.featuresSubtitle")}
						</p>
					</div>

					<div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
						{features.map(({ icon: Icon, key }, i) => (
							<div key={key} className="border-t border-(--border) pt-6">
								<div className="flex items-center justify-between">
									<span className="font-serif text-[1.15rem] font-medium italic text-(--gold)">
										{String(i + 1).padStart(2, "0")}
									</span>
									<Icon size={18} strokeWidth={1.5} className="text-(--text-subtle)" />
								</div>
								<h3 className="mt-5 font-serif text-[1.4rem] font-medium tracking-[-0.02em] text-(--text)">
									{t(`forBusiness.features.${key}.title`)}
								</h3>
								<p className="mt-2 max-w-sm text-[0.84rem] leading-relaxed text-(--text-muted)">
									{t(`forBusiness.features.${key}.desc`)}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="bg-(--gold) text-[#fffaf5]">
				<div className="page-wrap px-5 md:px-8 py-14 md:py-18">
					<div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
						<div>
							<p className="eyebrow text-[#fffaf5]/80 before:bg-[#fffaf5]/60">
								{t("forBusiness.ctaEyebrow")}
							</p>
							<h2 className="display display-sm mt-4 max-w-xl text-[#fffaf5]">
								{t("forBusiness.ctaTitle")}
							</h2>
							<p className="mt-3 max-w-md text-sm leading-relaxed text-[#fffaf5]/70">
								{t("forBusiness.ctaSubtitle")}
							</p>
						</div>
						<Link to="/register" search={{ role: "owner" }} className="btn btn-ink btn-lg shrink-0">
							{t("common.getStarted")} <ArrowRight size={16} />
						</Link>
					</div>
				</div>
			</section>
		</main>
	)
}
