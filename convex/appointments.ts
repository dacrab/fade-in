import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import type { Doc } from "./_generated/dataModel"
import { internalMutation, type MutationCtx, mutation, query } from "./_generated/server"
import { getCurrentUser, requireAdmin, requireOwner, requireUser } from "./lib/auth"
import { MAX_LIST_ROWS } from "./lib/limits"
import {
	assertBookableSlot,
	assertDurationMatches,
	DATE_RE,
	dayWindow,
	findConflicts,
	slotOptionsByBarber,
} from "./lib/scheduling"
import {
	applyAppointmentStatsChange,
	computeMonthRevenue,
	computeShopStats,
	currentMonthKey,
	getStatsRow,
} from "./lib/shopStats"
import { generateSlots, weekdayOf } from "./lib/slots"
import { MAX_DURATION_MINUTES } from "./validators"

const STALE_PENDING_MS = 24 * 60 * 60 * 1000

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
		assertDurationMatches(services, args.startTime, args.endTime)

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

		await applyAppointmentStatsChange(ctx, {
			barbershopId: args.barbershopId,
			date: args.date,
			totalPrice,
			to: "pending",
		})

		// Notify the shop owner so they can review the request. Scheduled so the
		// mutation stays atomic and a retry cannot produce a duplicate email.
		const owner = await ctx.db.get(shop.ownerId)
		if (owner?.email) {
			await ctx.scheduler.runAfter(0, internal.appointmentEmails.sendNewBookingNotification, {
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

/** Delete an appointment only if it is still pending and unpaid. */
async function deleteIfUnpaidPending(ctx: MutationCtx, appt: Doc<"appointments"> | null) {
	if (appt?.status !== "pending" || appt.paymentStatus === "paid") return
	await applyAppointmentStatsChange(ctx, {
		barbershopId: appt.barbershopId,
		date: appt.date,
		totalPrice: appt.totalPrice,
		from: appt.status,
	})
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
			.withIndex("by_status_createdAt", (q) => q.eq("status", "pending").lt("createdAt", cutoff))
			.collect()
		for (const appt of stale) {
			if (appt.polarCheckoutId && appt.paymentStatus !== "paid") {
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
			await applyAppointmentStatsChange(ctx, {
				barbershopId: appt.barbershopId,
				date: appt.date,
				totalPrice: appt.totalPrice,
				from: appt.status,
				to: args.status,
			})
			return ctx.db.patch(args.id, { status: args.status })
		}

		const shop = await ctx.db.get(appt.barbershopId)
		if (!shop) throw new ConvexError("Shop not found")

		if (shop.ownerId === userId || user.role === "admin") {
			await applyAppointmentStatsChange(ctx, {
				barbershopId: appt.barbershopId,
				date: appt.date,
				totalPrice: appt.totalPrice,
				from: appt.status,
				to: args.status,
			})
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

		// Fetch the appointment list and the customer's reviews together, then
		// join in memory. The previous shape exposed a `hasReview` query per row,
		// which created one subscription per appointment card on the dashboard.
		const [appointments, reviews] = await Promise.all([
			ctx.db
				.query("appointments")
				.withIndex("by_customer", (q) => q.eq("customerId", user._id))
				.order("desc")
				.take(MAX_LIST_ROWS),
			ctx.db
				.query("reviews")
				.withIndex("by_customer", (q) => q.eq("customerId", user._id))
				.take(MAX_LIST_ROWS),
		])
		const reviewed = new Set(reviews.map((r) => r.appointmentId))

		return appointments.map((appt) => ({ ...appt, hasReview: reviewed.has(appt._id) }))
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
				.take(MAX_LIST_ROWS)
		}
		return ctx.db
			.query("appointments")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.order("desc")
			.take(MAX_LIST_ROWS)
	},
})

export const listByBarber = query({
	args: { barberId: v.id("barbers"), date: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const barber = await ctx.db.get(args.barberId)
		if (!barber) throw new ConvexError("Barber not found")
		// The barber themself or the owning shop's owner may view the schedule.
		if (barber.userId !== user._id) {
			await requireOwner(ctx, barber.barbershopId)
		}

		// Filter in the index, not in JS: taking the newest 500 rows and then
		// filtering by date silently drops the selected day once a barber has
		// more than 500 lifetime appointments.
		if (args.date) {
			const date = args.date
			return ctx.db
				.query("appointments")
				.withIndex("by_barber_date", (q) => q.eq("barberId", args.barberId).eq("date", date))
				.order("desc")
				.take(MAX_LIST_ROWS)
		}

		return ctx.db
			.query("appointments")
			.withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
			.order("desc")
			.take(MAX_LIST_ROWS)
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
			await ctx.scheduler.runAfter(0, internal.appointmentEmails.sendBookingConfirmationEmail, {
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
		assertDurationMatches(services, args.startTime, args.endTime)

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
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		await requireAdmin(ctx)

		const page = await ctx.db.query("appointments").order("desc").paginate(args.paginationOpts)
		const appts = page.page

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

		return {
			...page,
			page: appts.map((a) => ({
				...a,
				shopName: shopNames.get(a.barbershopId) ?? "—",
				barberName: barberNames.get(a.barberId) ?? "—",
				customerName: customerNames.get(a.customerId) ?? "—",
			})),
		}
	},
})

export const getShopStats = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		await requireOwner(ctx, args.barbershopId)

		const stats = await getStatsRow(ctx, args.barbershopId)
		if (!stats?.backfilledAt) {
			// Shops that predate the aggregate (or whose backfill has not run yet)
			// still get exact numbers from the legacy computation.
			return computeShopStats(ctx, args.barbershopId)
		}

		const month = currentMonthKey()
		return {
			totalRevenue: stats.totalRevenue,
			monthRevenue:
				stats.monthKey === month
					? stats.monthRevenue
					: await computeMonthRevenue(ctx, args.barbershopId, month),
			completedCount: stats.completedCount,
			totalCount: stats.totalCount,
			pendingCount: stats.pendingCount,
			cancelledCount: stats.cancelledCount,
		}
	},
})
