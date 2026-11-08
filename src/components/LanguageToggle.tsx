import { useTranslation } from "react-i18next"
import { isLanguage, LANGUAGES, persistLanguage } from "#/i18n"

export default function LanguageToggle() {
	const { i18n, t } = useTranslation()
	const next = isLanguage(i18n.language) && i18n.language === "en" ? "el" : "en"
	const { flag, label } = LANGUAGES[next]

	const switchLanguage = () => {
		void i18n.changeLanguage(next)
		persistLanguage(next)
	}

	return (
		<button
			type="button"
			onClick={switchLanguage}
			className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-(--bg-input) text-(--text-muted)"
			title={t("common.switchLanguage", { lang: label })}
			aria-label={t("common.switchLanguage", { lang: label })}
		>
			<span>{flag}</span>
			<span className="hidden sm:inline">{label}</span>
		</button>
	)
}
