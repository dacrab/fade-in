import { useTranslation } from "react-i18next"
import { LANGUAGES, type Language, setLanguage } from "#/i18n"

function parseLanguage(val: string): Language {
	if (val === "en" || val === "el") return val
	return "en"
}

export default function LanguageToggle() {
	const { i18n, t } = useTranslation()
	const next = parseLanguage(i18n.language) === "en" ? "el" : "en"
	const { flag, label } = LANGUAGES[next]

	return (
		<button
			type="button"
			onClick={() => setLanguage(next)}
			className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-white/10 text-(--text-muted)"
			title={t("map.switchTo", { lang: label })}
		>
			<span>{flag}</span>
			<span className="hidden sm:inline">{label}</span>
		</button>
	)
}
