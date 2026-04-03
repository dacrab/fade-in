import { format, formatDistanceToNow, parseISO } from "date-fns"

/**
 * Formats a price in cents as a euro string.
 * @param cents - Price in cents
 * @returns Formatted price string, e.g., `formatPrice(1500)` → `"€15.00"`
 */
export function formatPrice(cents: number): string {
	return `€${(cents / 100).toFixed(2)}`
}

/**
 * Formats an ISO date string to a long date format.
 * @param dateStr - ISO date string
 * @returns Formatted date, e.g., "Monday, 3 April 2026"
 */
export function formatDate(dateStr: string): string {
	return format(parseISO(dateStr), "EEEE, d MMMM yyyy")
}

/**
 * Formats an ISO date string to a short date format.
 * @param dateStr - ISO date string
 * @returns Formatted short date, e.g., "3 Apr 2026"
 */
export function formatDateShort(dateStr: string): string {
	return format(parseISO(dateStr), "d MMM yyyy")
}

/**
 * Converts a 24-hour time string to 12-hour AM/PM format.
 * @param timeStr - Time string in HH:mm format
 * @returns Formatted time, e.g., "3:30 PM"
 */
export function formatTime(timeStr: string): string {
	const [h, m] = timeStr.split(":")
	const hour = parseInt(h, 10)
	const ampm = hour >= 12 ? "PM" : "AM"
	const hour12 = hour % 12 || 12
	return `${hour12}:${m} ${ampm}`
}

/**
 * Formats a timestamp as a relative time string.
 * @param timestamp - Milliseconds since epoch
 * @returns Relative time string, e.g., "2 hours ago"
 */
export function formatRelative(timestamp: number): string {
	return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

/**
 * Returns the days of the week in lowercase.
 * @returns Array of day names
 */
export function getDaysOfWeek() {
	return ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
}

/**
 * Capitalizes the first character of a string.
 * @param str - Input string
 * @returns String with first character capitalized
 */
export function capitalizeFirst(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Converts a string to a URL-friendly slug.
 * @param str - Input string
 * @returns Slugified string, e.g., "Hello World!" → "hello-world"
 */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
}
