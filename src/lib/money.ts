/** Formats a cents amount as a Euro string (e.g. 1500 -> "€15.00"). */
export function centsToEur(cents: number): string {
	return `€${(cents / 100).toFixed(2)}`
}
