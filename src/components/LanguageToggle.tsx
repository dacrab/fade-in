import { useTranslation } from "react-i18next"
import { LANGUAGES, type Language, setLanguage } from "#/i18n"

export default function LanguageToggle() {
	const { i18n, t } = useTranslation()
	const current = i18n.language as Language
	const next: Language = current === "en" ? "el" : "en"
	const nextLang = LANGUAGES[next]

	return (
		<button
			type="button"
			onClick={() => setLanguage(next)}
			className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[var(--bg-card-hover)] border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)]"
			title={t("map.switchTo", { lang: nextLang.label })}
		>
			<span>{nextLang.flag}</span>
			<span className="hidden sm:inline">{nextLang.label}</span>
		</button>
	)
}
