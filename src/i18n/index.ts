import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import el from "./locales/el"
import en from "./locales/en"

export const LANGUAGES = {
	en: { label: "English", flag: "🇬🇧" },
	el: { label: "Ελληνικά", flag: "🇬🇷" },
} as const

export type Language = keyof typeof LANGUAGES

const STORAGE_KEY = "fadein_lang"

function getInitialLanguage(): Language {
	try {
		const stored = localStorage.getItem(STORAGE_KEY) as Language | null
		if (stored && stored in LANGUAGES) return stored
		const browser = navigator.language.split("-")[0] as Language
		if (browser in LANGUAGES) return browser
	} catch {
		// SSR or localStorage unavailable
	}
	return "en"
}

void i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		el: { translation: el },
	},
	lng: getInitialLanguage(),
	fallbackLng: "en",
	interpolation: {
		escapeValue: false, // React already escapes
	},
	returnNull: false,
})

export function setLanguage(lang: Language): void {
	void i18n.changeLanguage(lang)
	try {
		localStorage.setItem(STORAGE_KEY, lang)
	} catch {
		// ignore
	}
}

export { i18n }
export default i18n
