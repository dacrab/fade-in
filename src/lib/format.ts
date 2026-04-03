import { format, formatDistanceToNow, parseISO } from "date-fns"

/** Formats a price in cents as a euro string, e.g. 1500 → "€15.00" */
export function formatPrice(cents: number): string {
	return `€${(cents / 100).toFixed(2)}`
}

/** Formats an ISO date string to long format, e.g. "Monday, 3 April 2026" */
export function formatDate(dateStr: string): string {
	return format(parseISO(dateStr), "EEEE, d MMMM yyyy")
}

/** Formats an ISO date string to short format, e.g. "3 Apr 2026" */
export function formatDateShort(dateStr: string): string {
	return format(parseISO(dateStr), "d MMM yyyy")
}

/** Converts a 24-hour "HH:mm" string to 12-hour AM/PM format, e.g. "14:30" → "2:30 PM" */
export function formatTime(timeStr: string): string {
	const [h, m] = timeStr.split(":")
	const hour = parseInt(h, 10)
	const ampm = hour >= 12 ? "PM" : "AM"
	const hour12 = hour % 12 || 12
	return `${hour12}:${m} ${ampm}`
}

/** Formats a timestamp (ms since epoch) as relative time, e.g. "2 hours ago" */
export function formatRelative(timestamp: number): string {
	return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

/** Capitalizes the first character of a string. */
export function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

/** Converts a string to a URL-friendly slug, e.g. "Hello World!" → "hello-world" */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}
