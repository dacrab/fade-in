import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
	internalAction,
	internalMutation,
	type MutationCtx,
	mutation,
	query,
} from "./_generated/server"
import { getCurrentUser, requireAdmin, requireOwner, requireUser } from "./lib/auth"
import { sendEmail } from "./lib/email"
import {
	DEFAULT_WINDOW,
	generateSlots,
	overlaps,
	SLOT_CONFIG,
	timeToMinutes,
	weekdayOf,
} from "./lib/slots"
import { MAX_DURATION_MINUTES, TIME_RE } from "./validators"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const STALE_PENDING_MS = 24 * 60 * 60 * 1000

type AppointmentFields = {
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
async function findConflicts(
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
function dayWindow(
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
async function assertBookableSlot(
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

export const getAvailableSlots = query({
	args: {
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		date: v.string(),
		durationMinutes: v.number(),
	},
	handler: async (ctx, args) => {
		if (!DATE_RE.test(args.date)) throw new ConvexError("Invalid date format")
		if (args.durationMinutes < 1 || args.durationMinutes > MAX_DURATION_MINUTES)
			throw new ConvexError("Invalid duration")

		const shop = await ctx.db.get(args.barbershopId)
		if (shop?.isActive !== true) throw new ConvexError("Shop is not available")

		const barber = await ctx.db.get(args.barberId)
		if (barber?.isActive !== true || barber.barbershopId !== args.barbershopId) return []
		const { closed, window } = dayWindow(
			shop.workingHours,
			barber?.workingHours,
			weekdayOf(args.date),
		)
		if (closed) return []

		const existing = await ctx.db
			.query("appointments")
			.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", args.date))
			.filter((q) =>
				q.and(q.eq(q.field("barberId"), args.barberId), q.neq(q.field("status"), "cancelled")),
			)
			.collect()

		return generateSlots(args.durationMinutes, existing, window)
	},
})

/**
 * Slots offered across every active barber on a date, mapped to the first barber
 * who can take each start time (backs the "any barber" booking option).
 */
function slotOptionsByBarber(
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

export const getAvailableSlotsForShop = query({
	args: {
		barbershopId: v.id("barbershops"),
		date: v.string(),
		durationMinutes: v.number(),
	},
	handler: async (ctx, args) => {
		if (!DATE_RE.test(args.date)) throw new ConvexError("Invalid date format")
		if (args.durationMinutes < 1 || args.durationMinutes > MAX_DURATION_MINUTES)
			throw new ConvexError("Invalid duration")

		const shop = await ctx.db.get(args.barbershopId)
		if (shop?.isActive !== true) throw new ConvexError("Shop is not available")

		const weekday = weekdayOf(args.date)
		if (shop.workingHours?.[weekday]?.closed) return []

		const [barbers, appointments] = await Promise.all([
			ctx.db
				.query("barbers")
				.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
				.filter((q) => q.eq(q.field("isActive"), true))
				.collect(),
			ctx.db
				.query("appointments")
				.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", args.date))
				.filter((q) => q.neq(q.field("status"), "cancelled"))
				.collect(),
		])

		return slotOptionsByBarber(
			appointments,
			barbers,
			shop.workingHours,
			weekday,
			args.durationMinutes,
		)
	},
})

export const create = mutation({
	args: {
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		serviceIds: v.array(v.id("services")),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const userId = user._id
		const { shop, barber } = await assertBookableSlot(
			ctx,
			args.barbershopId,
			args.barberId,
			args.date,
			args.startTime,
			args.endTime,
		)
		if (args.serviceIds.length === 0) throw new ConvexError("At least one service required")

		const services = await Promise.all(args.serviceIds.map((id) => ctx.db.get(id)))
		const totalPrice = services.reduce((sum, s) => {
			if (!s?.isActive) throw new ConvexError("Invalid service")
			if (s.barbershopId !== args.barbershopId) throw new ConvexError("Service not from this shop")
			return sum + s.price
		}, 0)
		const expectedDuration = services.reduce((sum, s) => sum + (s?.durationMinutes ?? 0), 0)
		const requestedDuration = timeToMinutes(args.endTime) - timeToMinutes(args.startTime)
		if (requestedDuration !== expectedDuration)
			throw new ConvexError("The selected time does not match the service duration")

		const conflict = await findConflicts(ctx, {
			barbershopId: args.barbershopId,
			barberId: args.barberId,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
		})
		if (conflict) throw new ConvexError("This time slot is no longer available.")

		// The conflict check above plus this insert run in a single mutation, which
		// Convex executes atomically and retries on write conflicts, so two
		// concurrent bookings cannot both claim the same slot.
		const appointmentId = await ctx.db.insert("appointments", {
			customerId: userId,
			barbershopId: args.barbershopId,
			barberId: args.barberId,
			serviceIds: args.serviceIds,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
			totalPrice,
			notes: args.notes,
			status: "pending",
			createdAt: Date.now(),
		})

		// Notify the shop owner so they can review the request. Scheduled so the
		// mutation stays atomic and a retry cannot produce a duplicate email.
		const owner = await ctx.db.get(shop.ownerId)
		if (owner?.email) {
			await ctx.scheduler.runAfter(0, internal.appointments.sendNewBookingNotification, {
				to: owner.email,
				customerName: user.name,
				shopName: shop.name,
				barberName: barber.name,
				date: args.date,
				startTime: args.startTime,
				endTime: args.endTime,
				totalPrice,
			})
		}

		return { appointmentId, totalPrice }
	},
})

export const sendBookingConfirmationEmail = internalAction({
	args: {
		to: v.string(),
		customerName: v.optional(v.string()),
		shopName: v.optional(v.string()),
		barberName: v.optional(v.string()),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		totalPrice: v.number(),
	},
	handler: async (_ctx, args) => {
		try {
			await sendEmail(
				args.to,
				`Booking Confirmed — ${args.shopName ?? "Barbershop"}`,
				`<p>Hi ${args.customerName ?? "there"},</p>
				<p>Your booking at <strong>${args.shopName ?? "Barbershop"}</strong> is confirmed!</p>
				<p><strong>Barber:</strong> ${args.barberName ?? "—"}<br>
				<strong>Date:</strong> ${args.date}<br>
				<strong>Time:</strong> ${args.startTime} – ${args.endTime}<br>
				<strong>Total:</strong> €${(args.totalPrice / 100).toFixed(2)}</p>
				<p>See you there!<br>— The FadeIn Team</p>`,
			)
		} catch {
			// Best-effort email: a delivery failure must not fail the booking.
		}
	},
})

export const sendNewBookingNotification = internalAction({
	args: {
		to: v.string(),
		customerName: v.optional(v.string()),
		shopName: v.optional(v.string()),
		barberName: v.optional(v.string()),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		totalPrice: v.number(),
	},
	handler: async (_ctx, args) => {
		try {
			await sendEmail(
				args.to,
				`New booking request — ${args.shopName ?? "Barbershop"}`,
				`<p>You have a new booking request at <strong>${args.shopName ?? "Barbershop"}</strong>.</p>
				<p><strong>Customer:</strong> ${args.customerName ?? "—"}<br>
				<strong>Barber:</strong> ${args.barberName ?? "—"}<br>
				<strong>Date:</strong> ${args.date}<br>
				<strong>Time:</strong> ${args.startTime} – ${args.endTime}<br>
				<strong>Total:</strong> €${(args.totalPrice / 100).toFixed(2)}</p>
				<p>— The FadeIn Team</p>`,
			)
		} catch {
			// Best-effort email: a delivery failure must not affect the booking.
		}
	},
})

/** Delete an appointment only if it is still pending and unpaid. */
async function deleteIfUnpaidPending(ctx: MutationCtx, appt: Doc<"appointments"> | null) {
	if (appt?.status !== "pending" || appt.paymentStatus === "paid") return
	await ctx.db.delete(appt._id)
}

export const removeUnpaidOrphan = internalMutation({
	args: { id: v.id("appointments") },
	handler: async (ctx, args) => {
		await deleteIfUnpaidPending(ctx, await ctx.db.get(args.id))
	},
})

/**
 * Reclaims slots held by abandoned Polar checkouts: deletes pending, unpaid
 * appointments that carry a checkout id. Onsite ("pay at the shop") bookings
 * have no checkout id and are left for the owner to confirm or cancel.
 */
export const sweepStalePending = internalMutation({
	args: {},
	handler: async (ctx) => {
		const cutoff = Date.now() - STALE_PENDING_MS
		const stale = await ctx.db
			.query("appointments")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.collect()
		for (const appt of stale) {
			if (appt.createdAt < cutoff && appt.polarCheckoutId && appt.paymentStatus !== "paid") {
				await ctx.db.delete(appt._id)
			}
		}
	},
})

export const removeUnpaidOrphanById = internalMutation({
	args: { polarCheckoutId: v.string() },
	handler: async (ctx, args) => {
		const appt = await ctx.db
			.query("appointments")
			.withIndex("by_polar_checkout", (q) => q.eq("polarCheckoutId", args.polarCheckoutId))
			.unique()
		await deleteIfUnpaidPending(ctx, appt)
	},
})

export const updateStatus = mutation({
	args: {
		id: v.id("appointments"),
		status: v.union(
			v.literal("pending"),
			v.literal("confirmed"),
			v.literal("completed"),
			v.literal("cancelled"),
		),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const userId = user._id

		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Not found")

		if (appt.customerId === userId) {
			if (args.status !== "cancelled") throw new ConvexError("Customers can only cancel appointments")
			// Note: cancelling frees the slot but does not void the Polar checkout
			// session, and checkouts abandoned before payment stay "pending" until
			// the user cancels. A cleanup job (or Polar checkout.expired webhook)
			// would be needed to reclaim those slots automatically.
			return ctx.db.patch(args.id, { status: args.status })
		}

		const shop = await ctx.db.get(appt.barbershopId)
		if (!shop) throw new ConvexError("Shop not found")

		if (shop.ownerId === userId || user.role === "admin") {
			return ctx.db.patch(args.id, { status: args.status })
		}

		throw new ConvexError("Not authorized")
	},
})

export const listByCustomer = query({
	args: {},
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx)
		if (!user) return []

		return ctx.db
			.query("appointments")
			.withIndex("by_customer", (q) => q.eq("customerId", user._id))
			.order("desc")
			.collect()
	},
})

export const listByShop = query({
	args: {
		barbershopId: v.id("barbershops"),
		date: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireOwner(ctx, args.barbershopId)

		const date = args.date
		if (date) {
			return ctx.db
				.query("appointments")
				.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", date))
				.order("desc")
				.collect()
		}
		return ctx.db
			.query("appointments")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.order("desc")
			.collect()
	},
})

export const listByBarber = query({
	args: { barberId: v.id("barbers") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const barber = await ctx.db.get(args.barberId)
		if (!barber) throw new ConvexError("Barber not found")
		// The barber themself or the owning shop's owner may view the schedule.
		if (barber.userId !== user._id) {
			await requireOwner(ctx, barber.barbershopId)
		}

		return ctx.db
			.query("appointments")
			.withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
			.order("desc")
			.collect()
	},
})

export const confirmFromCheckout = internalMutation({
	args: {
		polarCheckoutId: v.string(),
	},
	handler: async (ctx, args) => {
		const appt = await ctx.db
			.query("appointments")
			.withIndex("by_polar_checkout", (q) => q.eq("polarCheckoutId", args.polarCheckoutId))
			.unique()
		// A checkout whose appointment is gone (swept as stale, or created
		// outside this app) must still be acknowledged: Polar retries any
		// non-2xx response, so throwing here would retry forever. Log it instead,
		// so a paid checkout with no appointment stays visible for manual refund.
		if (!appt) {
			// biome-ignore lint/suspicious/noConsole: paid checkout with no appointment needs a durable record
			console.error(`Polar checkout ${args.polarCheckoutId} succeeded but has no appointment`)
			return
		}
		if (appt.status !== "pending") return // already confirmed
		await ctx.db.patch(appt._id, { status: "confirmed", paymentStatus: "paid" })

		// Confirmation email is sent only once payment has actually succeeded.
		const [customer, shop, barber] = await Promise.all([
			ctx.db.get(appt.customerId),
			ctx.db.get(appt.barbershopId),
			ctx.db.get(appt.barberId),
		])
		if (customer?.email) {
			// Scheduled so the mutation stays atomic: network I/O never runs inside
			// the transaction and a retry cannot produce a duplicate email.
			await ctx.scheduler.runAfter(0, internal.appointments.sendBookingConfirmationEmail, {
				to: customer.email,
				customerName: customer.name,
				shopName: shop?.name,
				barberName: barber?.name,
				date: appt.date,
				startTime: appt.startTime,
				endTime: appt.endTime,
				totalPrice: appt.totalPrice,
			})
		}
	},
})

/**
 * Internal-only: the client must never be able to (re)assign a checkout id to
 * an appointment, which would let it attach a paid checkout to another booking.
 */
export const setPolarCheckout = internalMutation({
	args: {
		id: v.id("appointments"),
		polarCheckoutId: v.string(),
	},
	handler: async (ctx, args) => {
		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Not found")
		if (appt.polarCheckoutId) throw new ConvexError("Checkout already set for this appointment")
		await ctx.db.patch(args.id, {
			polarCheckoutId: args.polarCheckoutId,
			paymentStatus: "unpaid",
		})
	},
})

export const getById = query({
	args: { id: v.id("appointments") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx)
		if (!user) return null

		const appt = await ctx.db.get(args.id)
		if (!appt) return null

		if (appt.customerId === user._id) return appt

		const shop = await ctx.db.get(appt.barbershopId)
		if (shop?.ownerId === user._id) return appt

		if (user.role === "admin") return appt

		const barber = await ctx.db.get(appt.barberId)
		if (barber?.userId === user._id) return appt

		return null
	},
})

export const reschedule = mutation({
	args: {
		id: v.id("appointments"),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Not found")
		if (appt.status === "completed" || appt.status === "cancelled")
			throw new ConvexError("Only upcoming appointments can be rescheduled")

		if (appt.customerId !== user._id && user.role !== "admin") {
			await requireOwner(ctx, appt.barbershopId)
		}

		// Keep the booked duration consistent with the appointment's services, as
		// `create` enforces — otherwise a reschedule could shrink or stretch a slot.
		const services = await Promise.all(appt.serviceIds.map((id) => ctx.db.get(id)))
		const expectedDuration = services.reduce((sum, s) => sum + (s?.durationMinutes ?? 0), 0)
		if (timeToMinutes(args.endTime) - timeToMinutes(args.startTime) !== expectedDuration)
			throw new ConvexError("The selected time does not match the service duration")

		await assertBookableSlot(
			ctx,
			appt.barbershopId,
			appt.barberId,
			args.date,
			args.startTime,
			args.endTime,
		)

		const conflict = await findConflicts(ctx, {
			barbershopId: appt.barbershopId,
			barberId: appt.barberId,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
			excludeId: appt._id,
		})
		if (conflict) throw new ConvexError("This time slot is no longer available.")

		await ctx.db.patch(args.id, {
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
		})
	},
})

export const listAllWithDetails = query({
	handler: async (ctx) => {
		await requireAdmin(ctx)

		const appts = await ctx.db.query("appointments").order("desc").collect()

		// Resolve each referenced entity once instead of once per appointment.
		const shopIds = [...new Set(appts.map((a) => a.barbershopId))]
		const barberIds = [...new Set(appts.map((a) => a.barberId))]
		const customerIds = [...new Set(appts.map((a) => a.customerId))]
		const [shops, barbers, customers] = await Promise.all([
			Promise.all(shopIds.map((id) => ctx.db.get(id))),
			Promise.all(barberIds.map((id) => ctx.db.get(id))),
			Promise.all(customerIds.map((id) => ctx.db.get(id))),
		])
		const shopNames = new Map(shops.map((s) => [s?._id, s?.name]))
		const barberNames = new Map(barbers.map((b) => [b?._id, b?.name]))
		const customerNames = new Map(customers.map((c) => [c?._id, c?.name]))

		return appts.map((a) => ({
			...a,
			shopName: shopNames.get(a.barbershopId) ?? "—",
			barberName: barberNames.get(a.barberId) ?? "—",
			customerName: customerNames.get(a.customerId) ?? "—",
		}))
	},
})

export const getShopStats = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		await requireOwner(ctx, args.barbershopId)

		const allAppts = await ctx.db
			.query("appointments")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.collect()

		const completed = allAppts.filter((a) => a.status === "completed")
		// Appointment dates are local-time "YYYY-MM-DD" strings; take the month
		// from local date parts rather than a UTC timestamp.
		const now = new Date()
		const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

		return {
			totalRevenue: completed.reduce((sum, a) => sum + a.totalPrice, 0),
			monthRevenue: completed
				.filter((a) => a.date.startsWith(thisMonth))
				.reduce((sum, a) => sum + a.totalPrice, 0),
			completedCount: completed.length,
			totalCount: allAppts.length,
			pendingCount: allAppts.filter((a) => a.status === "pending" || a.status === "confirmed").length,
			cancelledCount: allAppts.filter((a) => a.status === "cancelled").length,
		}
	},
})
