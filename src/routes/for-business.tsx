import { createFileRoute, Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { BarChart3, Calendar, Users, Star, Check, ArrowRight } from "lucide-react"

export const Route = createFileRoute("/for-business")({ component: ForBusinessPage })

function ForBusinessPage() {
	const { t } = useTranslation()

	const features = [
		{ icon: Calendar, key: "calendar" },
		{ icon: Users, key: "team" },
		{ icon: BarChart3, key: "analytics" },
		{ icon: Star, key: "reviews" },
	] as const

	const plans = [
		{
			key: "starter",
			features: ["1 barber", "Up to 50 bookings/month", "Basic analytics", "Customer reviews"],
			highlight: false,
		},
		{
			key: "pro",
			features: ["Up to 5 barbers", "Unlimited bookings", "Advanced analytics", "Priority support", "Custom working hours"],
			highlight: true,
		},
		{
			key: "enterprise",
			features: ["Unlimited barbers", "Multi-location", "API access", "Dedicated account manager"],
			highlight: false,
		},
	] as const

	return (
		<main>
			{/* Hero */}
			<section className="px-4 py-20 text-center relative overflow-hidden">
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-96 w-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)" }} />
				</div>
				<div className="page-wrap relative">
					<div className="inline-flex items-center gap-2 badge badge-gold mb-6">{t("forBusiness.badge")}</div>
					<h1 className="text-4xl sm:text-6xl font-bold text-[var(--text)] mb-6">
						{t("forBusiness.title")}<br /><span className="gold-text">{t("forBusiness.titleHighlight")}</span>
					</h1>
					<p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-8">{t("forBusiness.subtitle")}</p>
					<div className="flex flex-wrap gap-3 justify-center">
						<Link to="/register" className="btn btn-primary text-base px-8 py-3">
							{t("common.getStarted")} <ArrowRight size={16} />
						</Link>
						<Link to="/login" className="btn btn-secondary text-base px-8 py-3">{t("common.signIn")}</Link>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="px-4 py-16 border-t border-[var(--border)]">
				<div className="page-wrap">
					<div className="text-center mb-12">
						<h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t("forBusiness.featuresTitle")}</h2>
						<p className="text-[var(--text-muted)]">{t("forBusiness.featuresSubtitle")}</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
						{features.map(({ icon: Icon, key }) => (
							<div key={key} className="card p-6 flex gap-4">
								<div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
									<Icon size={20} className="text-[var(--gold)]" />
								</div>
								<div>
									<h3 className="font-bold text-[var(--text)] mb-1">{t(`forBusiness.features.${key}.title`)}</h3>
									<p className="text-sm text-[var(--text-muted)]">{t(`forBusiness.features.${key}.desc`)}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="px-4 py-16 border-t border-[var(--border)]">
				<div className="page-wrap">
					<div className="text-center mb-12">
						<h2 className="text-2xl font-bold text-[var(--text)] mb-2">{t("forBusiness.pricingTitle")}</h2>
						<p className="text-[var(--text-muted)]">{t("forBusiness.pricingSubtitle")}</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
						{plans.map((plan) => (
							<div
								key={plan.key}
								className={`card p-6 ${plan.highlight ? "border-[var(--gold)]/40" : ""}`}
								style={plan.highlight ? { background: "rgba(245,158,11,0.04)" } : {}}
							>
								{plan.highlight && <div className="badge badge-gold mb-3">{t("forBusiness.mostPopular")}</div>}
								<h3 className="font-bold text-[var(--text)] text-lg mb-1">{t(`forBusiness.plans.${plan.key}.name`)}</h3>
								<div className="text-3xl font-bold text-[var(--text)] mb-1">{t(`forBusiness.plans.${plan.key}.price`)}</div>
								<p className="text-sm text-[var(--text-muted)] mb-5">{t(`forBusiness.plans.${plan.key}.desc`)}</p>
								<ul className="space-y-2 mb-6">
									{plan.features.map((f) => (
										<li key={f} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
											<Check size={14} className="text-[var(--gold)]" /> {f}
										</li>
									))}
								</ul>
								<Link
									to="/register"
									className={`btn w-full justify-center ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
								>
									{t("common.getStarted")}
								</Link>
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
	)
}
