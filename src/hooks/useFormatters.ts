import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
	type DateLocale,
	formatDate,
	formatDateShort,
	formatPrice,
	formatRelative,
} from "#/lib/format"

export interface Formatters {
	formatPrice: (cents: number) => string
	formatDate: (dateStr: string) => string
	formatDateShort: (dateStr: string) => string
	formatRelative: (timestamp: number) => string
}

export function useFormatters(): Formatters {
	const { i18n } = useTranslation()
	const locale: DateLocale = i18n.language === "el" ? "el" : "en"

	return useMemo(
		() => ({
			formatPrice: (cents: number) => formatPrice(cents, locale),
			formatDate: (dateStr: string) => formatDate(dateStr, locale),
			formatDateShort: (dateStr: string) => formatDateShort(dateStr, locale),
			formatRelative: (timestamp: number) => formatRelative(timestamp, locale),
		}),
		[locale],
	)
}
