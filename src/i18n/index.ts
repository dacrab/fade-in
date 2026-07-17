import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import el from "./locales/el"
import en from "./locales/en"

export const LANGUAGES = {
	en: { label: "English", flag: "EN" },
	el: { label: "Ελληνικά", flag: "EL" },
} as const

export type Language = keyof typeof LANGUAGES

const STORAGE_KEY = "fadein_lang"

function isLanguage(val: string | null): val is Language {
	return val !== null && Object.keys(LANGUAGES).includes(val)
}

function getInitialLanguage(): Language {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (isLanguage(stored)) return stored
		const browser = navigator.language.split("-")[0]
		if (isLanguage(browser)) return browser
	} catch {}
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
		escapeValue: false,
	},
})

export function setLanguage(lang: Language): void {
	void i18n.changeLanguage(lang)
	try {
		localStorage.setItem(STORAGE_KEY, lang)
	} catch {}
}

export default i18n
