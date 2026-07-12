/**
 * i18n parity test — ensures every key present in the English locale is also
 * present in the Greek locale and vice-versa, and that no value is an empty
 * string in either locale.
 *
 * Uses a recursive key-path extractor so nested objects are fully checked.
 */
import { describe, expect, it } from "vitest"
import el from "./el"
import en from "./en"

// Recursively extract all dot-separated key paths from a nested object
function extractKeys(obj: Record<string, unknown>, prefix = ""): string[] {
	const keys: string[] = []
	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			keys.push(...extractKeys(value as Record<string, unknown>, path))
		} else {
			keys.push(path)
		}
	}
	return keys
}

// Resolve a dot-path in a nested object
function getByPath(obj: Record<string, unknown>, path: string): unknown {
	return path.split(".").reduce<unknown>((acc, part) => {
		if (acc !== null && typeof acc === "object") {
			return (acc as Record<string, unknown>)[part]
		}
		return undefined
	}, obj)
}

const enKeys = extractKeys(en as unknown as Record<string, unknown>)
const elKeys = extractKeys(el as unknown as Record<string, unknown>)

describe("i18n locale parity — English ↔ Greek", () => {
	// Key existence
	it.each([
		["English", enKeys, elKeys],
		["Greek", elKeys, enKeys],
	])("every %s key exists in the other locale", (label, sourceKeys, otherKeys) => {
		const missing = sourceKeys.filter((k) => !otherKeys.includes(k))
		expect(
			missing,
			`Keys in ${label} missing from the other locale: ${missing.join(", ")}`,
		).toHaveLength(0)
	})

	// value completeness
	it.each([
		["English", en, enKeys],
		["Greek", el, elKeys],
	])("no %s value is an empty string", (label, locale, keys) => {
		const empty = keys.filter(
			(k) => getByPath(locale as unknown as Record<string, unknown>, k) === "",
		)
		expect(empty, `${label} keys with empty values: ${empty.join(", ")}`).toHaveLength(0)
	})

	// value types match
	// Arrays are valid i18n values (e.g. feature lists), so we only flag
	// non-string, non-array leaf values.
	it("all leaf values are strings or arrays (no unexpected object leaves)", () => {
		const isLeaf = (v: unknown) => typeof v === "string" || Array.isArray(v)
		const badEn = enKeys.filter(
			(k) => !isLeaf(getByPath(en as unknown as Record<string, unknown>, k)),
		)
		const badEl = elKeys.filter(
			(k) => !isLeaf(getByPath(el as unknown as Record<string, unknown>, k)),
		)
		expect(badEn, `EN non-string/array values: ${badEn.join(", ")}`).toHaveLength(0)
		expect(badEl, `EL non-string/array values: ${badEl.join(", ")}`).toHaveLength(0)
	})

	// Arrays in i18n (e.g. feature lists) must have matching lengths in both locales
	it("array values have the same length in both locales", () => {
		const arrayKeys = enKeys.filter((k) =>
			Array.isArray(getByPath(en as unknown as Record<string, unknown>, k)),
		)
		const mismatched: string[] = []
		for (const k of arrayKeys) {
			const enArr = getByPath(en as unknown as Record<string, unknown>, k) as unknown[]
			const elArr = getByPath(el as unknown as Record<string, unknown>, k) as unknown[]
			if (!Array.isArray(elArr) || enArr.length !== elArr.length) {
				mismatched.push(k)
			}
		}
		expect(mismatched, `Array length mismatches: ${mismatched.join(", ")}`).toHaveLength(0)
	})
})
