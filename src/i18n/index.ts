import { createIsomorphicFn } from "@tanstack/react-start"
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server"
import i18next, { type i18n as I18nInstance, type InitOptions } from "i18next"
import { initReactI18next } from "react-i18next"
import el from "./locales/el"
import en from "./locales/en"

export const LANGUAGES = {
	en: { label: "English", flag: "EN" },
	el: { label: "Ελληνικά", flag: "EL" },
} as const

export type Language = keyof typeof LANGUAGES

export const LANGUAGE_COOKIE = "fadein_lang"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const RESOURCES = {
	en: { translation: en },
	el: { translation: el },
}

function initOptions(language: Language): InitOptions {
	return {
		resources: RESOURCES,
		lng: language,
		fallbackLng: "en",
		// Resources are bundled, so initialization completes synchronously and
		// SSR never renders a frame of translation keys.
		initAsync: false,
		interpolation: { escapeValue: false },
		react: { useSuspense: false },
	}
}

// English fallback used by components rendered outside the root provider
// (e.g. the router's error boundary).
void i18next.use(initReactI18next).init(initOptions("en"))

/** A fresh instance per render on the server, so concurrent requests cannot
 * share language state. */
export function createI18n(language: Language): I18nInstance {
	const instance = i18next.createInstance()
	void instance.init(initOptions(language))
	return instance
}

export function isLanguage(value: string | null | undefined): value is Language {
	return value != null && Object.hasOwn(LANGUAGES, value)
}

function readLanguageCookie(): string | undefined {
	if (typeof document === "undefined") return undefined
	const prefix = `${LANGUAGE_COOKIE}=`
	const entry = document.cookie
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(prefix))
	return entry?.slice(prefix.length)
}

function browserLanguage(): Language {
	const browser = navigator.language.split("-")[0]
	return isLanguage(browser) ? browser : "en"
}

export function persistLanguage(language: Language): void {
	try {
		// biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not supported in all target browsers.
		document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
	} catch {
		// Cookies may be unavailable (private mode); language still applies in-memory.
	}
}

/**
 * Resolve the request language so the server and the hydrating client agree.
 * On the first request the server negotiates from `Accept-Language` and stores
 * the result in a cookie, which the client then reads back.
 */
export const resolveLanguage = createIsomorphicFn()
	.server((): Language => {
		const stored = getCookie(LANGUAGE_COOKIE)
		if (isLanguage(stored)) return stored

		const accepted = getRequestHeader("accept-language")
		const preferred = accepted?.split(",")[0]?.trim().split("-")[0]
		const language = isLanguage(preferred) ? preferred : "en"

		setCookie(LANGUAGE_COOKIE, language, {
			path: "/",
			maxAge: COOKIE_MAX_AGE,
			sameSite: "lax",
		})
		return language
	})
	.client((): Language => {
		const stored = readLanguageCookie()
		return isLanguage(stored) ? stored : browserLanguage()
	})
