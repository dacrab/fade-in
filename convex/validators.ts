import { v } from "convex/values"

const dayHours = v.object({ open: v.string(), close: v.string(), closed: v.boolean() })

export const workingHoursValidator = v.optional(
	v.object({
		monday: v.optional(dayHours),
		tuesday: v.optional(dayHours),
		wednesday: v.optional(dayHours),
		thursday: v.optional(dayHours),
		friday: v.optional(dayHours),
		saturday: v.optional(dayHours),
		sunday: v.optional(dayHours),
	}),
)

export const socialLinksValidator = v.optional(
	v.object({
		instagram: v.optional(v.string()),
		facebook: v.optional(v.string()),
		website: v.optional(v.string()),
	}),
)

/** Strips undefined fields from a partial update object before patching. */
export function filterDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
	return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}
