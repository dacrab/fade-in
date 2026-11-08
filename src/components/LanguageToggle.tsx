import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import { isLanguage, LANGUAGES, persistLanguage } from "#/i18n"

export default function LanguageToggle() {
	const { i18n, t } = useTranslation()
	const current = isLanguage(i18n.language) ? i18n.language : "en"
	const next = current === "en" ? "el" : "en"
	const { label } = LANGUAGES[next]

	const switchLanguage = () => {
		void i18n.changeLanguage(next)
		persistLanguage(next)
	}

	return (
		<button
			type="button"
			onClick={switchLanguage}
			className="flex h-9 items-center gap-1.5 rounded-(--radius) border border-(--border) bg-(--bg-card) px-2.5 text-[11px] font-semibold tracking-[0.06em] text-(--text-muted) transition-colors hover:border-(--border-hover) hover:text-(--text)"
			title={t("common.switchLanguage", { lang: label })}
			aria-label={t("common.switchLanguage", { lang: label })}
		>
			<Globe size={13} strokeWidth={1.7} />
			{LANGUAGES[current].flag}
		</button>
	)
}
