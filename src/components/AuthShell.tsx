import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import BrandLockup from "./BrandLockup"

export default function AuthShell({
	title,
	subtitle,
	children,
}: {
	title: string
	subtitle: string
	children: ReactNode
}) {
	const { t } = useTranslation()

	return (
		<main className="flex flex-1 items-center justify-center px-4 py-10 md:py-14">
			<div className="grid w-full max-w-[1080px] overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--bg-card) shadow-[var(--shadow-md)] lg:grid-cols-[0.92fr_1.08fr]">
				<div className="relative hidden min-h-[620px] lg:block">
					<picture className="contents">
						<source
							type="image/webp"
							srcSet="/images/barber-detail-600.webp 600w, /images/barber-detail-1000.webp 1000w"
							sizes="(min-width: 1024px) 45vw, 100vw"
						/>
						<img
							src="/images/barber-detail.jpg"
							alt={t("auth.imageAlt")}
							className="absolute inset-0 h-full w-full object-cover"
							width={1000}
							height={1500}
							decoding="async"
						/>
					</picture>
					<div className="absolute inset-0 bg-gradient-to-t from-[#191512]/85 via-[#191512]/15 to-[#191512]/10" />
					<div className="absolute left-8 top-8 text-[#fffaf5]/85">
						<BrandLockup
							size={32}
							className="gap-2"
							wordmarkClassName="text-[1.2rem]"
							accentClassName="text-(--gold-light)"
						/>
					</div>
					<div className="absolute inset-x-8 bottom-8">
						<p className="max-w-xs font-serif text-[2rem] font-medium leading-[1.12] tracking-[-0.025em] text-[#fffaf5]">
							{t("auth.imageTitle")}
						</p>
						<p className="mt-3 max-w-xs text-[13px] leading-relaxed text-[#fffaf5]/60">
							{t("auth.imageSubtitle")}
						</p>
					</div>
				</div>

				<div className="relative flex flex-col justify-center lg:min-h-[620px]">
					<div className="relative h-32 overflow-hidden lg:hidden">
						<picture className="contents">
							<source
								type="image/webp"
								srcSet="/images/barber-detail-600.webp 600w, /images/barber-detail-1000.webp 1000w"
								sizes="100vw"
							/>
							<img
								src="/images/barber-detail.jpg"
								alt=""
								className="h-full w-full object-cover object-[center_35%]"
								width={1000}
								height={1500}
								decoding="async"
							/>
						</picture>
						<div className="absolute inset-0 bg-gradient-to-t from-(--bg-card) via-transparent to-transparent" />
					</div>
					<div className="px-6 py-8 sm:px-10 md:px-14 md:py-12">
						<h1 className="display text-[clamp(2rem,4vw,2.6rem)] text-(--text)">{title}</h1>
						<p className="mt-2 text-sm text-(--text-muted)">{subtitle}</p>
						<div className="mt-7">{children}</div>
					</div>
				</div>
			</div>
		</main>
	)
}
