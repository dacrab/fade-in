/**
 * URL slug that keeps Unicode letters/numbers (so Greek names survive) while
 * stripping accent marks and collapsing everything else to single hyphens.
 */
export function slugify(str: string): string {
	return str
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, "-")
		.replace(/^-+|-+$/g, "")
}
