import { useTranslation } from "react-i18next"
import {
	type DateLocale,
	formatDate,
	formatDateShort,
	formatPrice,
	formatRelative,
} from "#/lib/format"

export function useFormatters() {
	const { i18n } = useTranslation()
	const locale: DateLocale = i18n.language === "el" ? "el" : "en"

	return {
		formatPrice,
		formatDate: (dateStr: string) => formatDate(dateStr, locale),
		formatDateShort: (dateStr: string) => formatDateShort(dateStr, locale),
		formatRelative: (timestamp: number) => formatRelative(timestamp, locale),
	}
}
