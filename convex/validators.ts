import type { Infer } from "convex/values"
import { ConvexError, v } from "convex/values"

export function definedPatch<T extends Record<string, unknown>>(obj: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(obj).filter(([, value]) => value !== undefined),
	) as Partial<T>
}

const dayHours = v.object({ open: v.string(), close: v.string(), closed: v.boolean() })

export const TIME_RE = /^\d{2}:\d{2}$/
export const MAX_DURATION_MINUTES = 480

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

type WorkingHoursInput = Infer<typeof workingHoursValidator>

/** Semantic check beyond the schema validator: open days need valid HH:mm with close > open. */
export function assertValidWorkingHours(hours: WorkingHoursInput) {
	if (!hours) return
	for (const [day, h] of Object.entries(hours)) {
		if (!h || h.closed) continue
		if (!(TIME_RE.test(h.open) && TIME_RE.test(h.close))) {
			throw new ConvexError(`Invalid opening hours for ${day}`)
		}
		if (h.close <= h.open) {
			throw new ConvexError(`Closing time must be after opening time on ${day}`)
		}
	}
}

export const socialLinksValidator = v.optional(
	v.object({
		instagram: v.optional(v.string()),
		facebook: v.optional(v.string()),
		website: v.optional(v.string()),
	}),
)
