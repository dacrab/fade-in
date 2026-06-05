import { v } from "convex/values"

/** Strip undefined values from an object (for partial DB patches). */
export function definedPatch<T extends Record<string, unknown>>(obj: T): Partial<T> {
	return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>
}

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
