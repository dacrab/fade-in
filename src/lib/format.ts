export type DateLocale = "en" | "el"

const INTL_LOCALES: Record<DateLocale, string> = { en: "en-IE", el: "el-GR" }

const PRICE_FORMATTERS: Record<DateLocale, Intl.NumberFormat> = {
	en: new Intl.NumberFormat(INTL_LOCALES.en, { style: "currency", currency: "EUR" }),
	el: new Intl.NumberFormat(INTL_LOCALES.el, { style: "currency", currency: "EUR" }),
}

const WEEKDAY_FORMATTERS: Record<DateLocale, Intl.DateTimeFormat> = {
	en: new Intl.DateTimeFormat(INTL_LOCALES.en, { weekday: "long" }),
	el: new Intl.DateTimeFormat(INTL_LOCALES.el, { weekday: "long" }),
}

const LONG_DATE_FORMATTERS: Record<DateLocale, Intl.DateTimeFormat> = {
	en: new Intl.DateTimeFormat(INTL_LOCALES.en, {
		day: "numeric",
		month: "long",
		year: "numeric",
	}),
	el: new Intl.DateTimeFormat(INTL_LOCALES.el, {
		day: "numeric",
		month: "long",
		year: "numeric",
	}),
}

const SHORT_DATE_FORMATTERS: Record<DateLocale, Intl.DateTimeFormat> = {
	en: new Intl.DateTimeFormat(INTL_LOCALES.en, {
		day: "numeric",
		month: "short",
		year: "numeric",
	}),
	el: new Intl.DateTimeFormat(INTL_LOCALES.el, {
		day: "numeric",
		month: "short",
		year: "numeric",
	}),
}

const RELATIVE_FORMATTERS: Record<DateLocale, Intl.RelativeTimeFormat> = {
	en: new Intl.RelativeTimeFormat(INTL_LOCALES.en, { numeric: "auto" }),
	el: new Intl.RelativeTimeFormat(INTL_LOCALES.el, { numeric: "auto" }),
}

export function formatPrice(cents: number, locale: DateLocale = "en"): string {
	if (!Number.isFinite(cents)) return "—"
	return PRICE_FORMATTERS[locale].format(cents / 100)
}

/** Parse a `YYYY-MM-DD` date as local midnight, rejecting out-of-range parts. */
function parseDate(dateStr: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
	if (!match) return null
	const year = Number(match[1])
	const month = Number(match[2]) - 1
	const day = Number(match[3])
	const date = new Date(year, month, day)
	const roundTrips =
		date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
	return roundTrips ? date : null
}

export function formatDate(dateStr: string, locale: DateLocale = "en"): string {
	const parsed = parseDate(dateStr)
	if (!parsed) return "—"
	return `${WEEKDAY_FORMATTERS[locale].format(parsed)}, ${LONG_DATE_FORMATTERS[locale].format(parsed)}`
}

export function formatDateShort(dateStr: string, locale: DateLocale = "en"): string {
	const parsed = parseDate(dateStr)
	return parsed ? SHORT_DATE_FORMATTERS[locale].format(parsed) : "—"
}

export function formatRelative(timestamp: number, locale: DateLocale = "en"): string {
	const date = new Date(timestamp)
	if (Number.isNaN(date.getTime())) return "—"

	const seconds = Math.round((date.getTime() - Date.now()) / 1000)
	const abs = Math.abs(seconds)
	const rtf = RELATIVE_FORMATTERS[locale]

	if (abs < 60) return rtf.format(seconds, "second")
	if (abs < 60 * 60) return rtf.format(Math.round(seconds / 60), "minute")
	if (abs < 24 * 60 * 60) return rtf.format(Math.round(seconds / (60 * 60)), "hour")
	if (abs < 7 * 24 * 60 * 60) return rtf.format(Math.round(seconds / (24 * 60 * 60)), "day")
	if (abs < 5 * 7 * 24 * 60 * 60) return rtf.format(Math.round(seconds / (7 * 24 * 60 * 60)), "week")
	if (abs < 365 * 24 * 60 * 60) return rtf.format(Math.round(seconds / (30 * 24 * 60 * 60)), "month")
	return rtf.format(Math.round(seconds / (365 * 24 * 60 * 60)), "year")
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
