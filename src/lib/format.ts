import { format, formatDistanceToNow, isValid, type Locale, parseISO } from "date-fns"
import { el, enUS } from "date-fns/locale"

export type DateLocale = "en" | "el"

const DATE_LOCALES: Record<DateLocale, Locale> = { en: enUS, el }
const INTL_LOCALES: Record<DateLocale, string> = { en: "en-IE", el: "el-GR" }

const PRICE_FORMATTERS: Record<DateLocale, Intl.NumberFormat> = {
	en: new Intl.NumberFormat(INTL_LOCALES.en, { style: "currency", currency: "EUR" }),
	el: new Intl.NumberFormat(INTL_LOCALES.el, { style: "currency", currency: "EUR" }),
}

export function formatPrice(cents: number, locale: DateLocale = "en"): string {
	if (!Number.isFinite(cents)) return "—"
	return PRICE_FORMATTERS[locale].format(cents / 100)
}

function parseDate(dateStr: string): Date | null {
	const parsed = parseISO(dateStr)
	return isValid(parsed) ? parsed : null
}

export function formatDate(dateStr: string, locale: DateLocale = "en"): string {
	const parsed = parseDate(dateStr)
	return parsed ? format(parsed, "EEEE, d MMMM yyyy", { locale: DATE_LOCALES[locale] }) : "—"
}

export function formatDateShort(dateStr: string, locale: DateLocale = "en"): string {
	const parsed = parseDate(dateStr)
	return parsed ? format(parsed, "d MMM yyyy", { locale: DATE_LOCALES[locale] }) : "—"
}

export function formatRelative(timestamp: number, locale: DateLocale = "en"): string {
	const date = new Date(timestamp)
	if (!isValid(date)) return "—"
	return formatDistanceToNow(date, { addSuffix: true, locale: DATE_LOCALES[locale] })
}

function toIsoDate(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function todayIso(): string {
	return toIsoDate(new Date())
}

export function nextDayIso(): string {
	const d = new Date()
	d.setDate(d.getDate() + 1)
	return toIsoDate(d)
}
