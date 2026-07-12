import { format, formatDistanceToNow, parseISO } from "date-fns"
import { centsToEur } from "./money"

export function formatPrice(cents: number): string {
	return centsToEur(cents)
}

export function formatDate(dateStr: string): string {
	return format(parseISO(dateStr), "EEEE, d MMMM yyyy")
}

export function formatDateShort(dateStr: string): string {
	return format(parseISO(dateStr), "d MMM yyyy")
}

export function formatRelative(timestamp: number): string {
	return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

export function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}
