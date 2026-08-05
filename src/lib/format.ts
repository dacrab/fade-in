import { format, formatDistanceToNow, type Locale, parseISO } from "date-fns"
import { el, enUS } from "date-fns/locale"

export type DateLocale = "en" | "el"

const DATE_LOCALES: Record<DateLocale, Locale> = { en: enUS, el }

export function formatPrice(cents: number): string {
	return `€${(cents / 100).toFixed(2)}`
}

export function formatDate(dateStr: string, locale: DateLocale = "en"): string {
	return format(parseISO(dateStr), "EEEE, d MMMM yyyy", { locale: DATE_LOCALES[locale] })
}

export function formatDateShort(dateStr: string, locale: DateLocale = "en"): string {
	return format(parseISO(dateStr), "d MMM yyyy", { locale: DATE_LOCALES[locale] })
}

export function formatRelative(timestamp: number, locale: DateLocale = "en"): string {
	return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: DATE_LOCALES[locale] })
}

export function todayIso(): string {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function nextDayIso(): string {
	const d = new Date()
	d.setDate(d.getDate() + 1)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}
