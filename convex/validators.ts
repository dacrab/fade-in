import { v } from "convex/values"

/** Validator for a single day's working hours entry. */
const dayHours = v.object({
	open: v.string(),
	close: v.string(),
	closed: v.boolean(),
})

/** Typed validator for the workingHours field, matching the schema definition. */
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

/** Typed validator for social links. */
export const socialLinksValidator = v.optional(
	v.object({
		instagram: v.optional(v.string()),
		facebook: v.optional(v.string()),
		website: v.optional(v.string()),
	}),
)
