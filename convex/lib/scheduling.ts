import { ConvexError } from "convex/values"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"
import { TIME_RE } from "../validators"
import {
	DEFAULT_WINDOW,
	generateSlots,
	overlaps,
	SLOT_CONFIG,
	timeToMinutes,
	weekdayOf,
} from "./slots"

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export type AppointmentFields = {
	barbershopId: Id<"barbershops">
	barberId: Id<"barbers">
	date: string
	startTime: string
	endTime: string
}

/**
 * Appointments on the same barber/day that overlap the requested window,
 * excluding `excludeId` (used when rescheduling an existing appointment).
 */
export async function findConflicts(
	ctx: MutationCtx,
	args: AppointmentFields & { excludeId?: Id<"appointments"> },
) {
	const existing = await ctx.db
		.query("appointments")
		.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", args.date))
		.filter((q) => {
			const conditions = [
				q.eq(q.field("barberId"), args.barberId),
				q.neq(q.field("status"), "cancelled"),
			]
			if (args.excludeId !== undefined) conditions.push(q.neq(q.field("_id"), args.excludeId))
			return q.and(...conditions)
		})
		.collect()

	return existing.some((a) => overlaps(args.startTime, args.endTime, a))
}

/**
 * Effective hours for a barber on a given weekday. The shop's hours are the
 * outer bound: a closed shop closes the day, while a barber's own hours narrow
 * (or close) their day. Falls back to the shop's window, then to the default
 * window when neither defines one.
 */
export function dayWindow(
	shopHours: Doc<"barbershops">["workingHours"],
	barberHours: Doc<"barbers">["workingHours"],
	weekday: ReturnType<typeof weekdayOf>,
): { closed: boolean; window?: { startMinute: number; endMinute: number } } {
	const shopDay = shopHours?.[weekday]
	if (shopDay?.closed) return { closed: true }

	const barberDay = barberHours?.[weekday]
	if (barberDay) {
		if (barberDay.closed) return { closed: true }
		return {
			closed: false,
			window: {
				startMinute: timeToMinutes(barberDay.open),
				endMinute: timeToMinutes(barberDay.close),
			},
		}
	}

	if (shopDay) {
		return {
			closed: false,
			window: { startMinute: timeToMinutes(shopDay.open), endMinute: timeToMinutes(shopDay.close) },
		}
	}

	return { closed: false }
}

/**
 * Validates a requested slot against the shop and barber hours, returning the
 * shop and barber. Shared by every mutation that writes a date/time onto an
 * appointment so none of them can skip the checks.
 */
export async function assertBookableSlot(
	ctx: MutationCtx,
	barbershopId: Id<"barbershops">,
	barberId: Id<"barbers">,
	date: string,
	startTime: string,
	endTime: string,
) {
	if (!DATE_RE.test(date)) throw new ConvexError("Invalid date format")
	if (!(TIME_RE.test(startTime) && TIME_RE.test(endTime)))
		throw new ConvexError("Invalid time format")
	if (startTime >= endTime) throw new ConvexError("Invalid time range")

	const shop = await ctx.db.get(barbershopId)
	if (shop?.isActive !== true) throw new ConvexError("Shop is not available")

	const barber = await ctx.db.get(barberId)
	if (!barber || barber.barbershopId !== barbershopId)
		throw new ConvexError("Invalid barber for this shop")
	if (barber.isActive !== true) throw new ConvexError("Barber is not available")

	const { closed, window } = dayWindow(shop.workingHours, barber.workingHours, weekdayOf(date))
	if (closed) throw new ConvexError("Barber is not available on this date")

	const openMinute = window?.startMinute ?? DEFAULT_WINDOW.startMinute
	const closeMinute = window?.endMinute ?? DEFAULT_WINDOW.endMinute
	const start = timeToMinutes(startTime)
	if (
		start < openMinute ||
		timeToMinutes(endTime) > closeMinute ||
		(start - openMinute) % SLOT_CONFIG.INTERVAL_MINUTES !== 0
	)
		throw new ConvexError("Time is outside of operating hours")

	return { shop, barber }
}

/** Guard against a booking whose time range does not match its services. */
export function assertDurationMatches(
	services: ({ durationMinutes: number } | null)[],
	startTime: string,
	endTime: string,
) {
	const expectedDuration = services.reduce((sum, s) => sum + (s?.durationMinutes ?? 0), 0)
	const requestedDuration = timeToMinutes(endTime) - timeToMinutes(startTime)
	if (requestedDuration !== expectedDuration)
		throw new ConvexError("The selected time does not match the service duration")
}

/**
 * Slots offered across every active barber on a date, mapped to the first barber
 * who can take each start time (backs the "any barber" booking option).
 */
export function slotOptionsByBarber(
	appointments: Doc<"appointments">[],
	barbers: Doc<"barbers">[],
	shopHours: Doc<"barbershops">["workingHours"],
	weekday: ReturnType<typeof weekdayOf>,
	durationMinutes: number,
): { startTime: string; barberId: Id<"barbers"> }[] {
	const byBarber = new Map<string, Doc<"appointments">[]>()
	for (const appt of appointments) {
		const list = byBarber.get(appt.barberId)
		if (list) list.push(appt)
		else byBarber.set(appt.barberId, [appt])
	}

	const earliest = new Map<string, Id<"barbers">>()
	for (const barber of barbers) {
		const { closed, window } = dayWindow(shopHours, barber.workingHours, weekday)
		if (closed) continue
		for (const startTime of generateSlots(durationMinutes, byBarber.get(barber._id) ?? [], window)) {
			if (!earliest.has(startTime)) earliest.set(startTime, barber._id)
		}
	}

	return [...earliest.entries()]
		.map(([startTime, barberId]) => ({ startTime, barberId }))
		.sort((a, b) => a.startTime.localeCompare(b.startTime))
}
