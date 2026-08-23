import { ConvexError, v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction, internalMutation, mutation, query } from "./_generated/server"
import { getCurrentUser, requireAdmin, requireOwner, requireUser } from "./lib/auth"
import { sendEmail } from "./lib/email"
import { generateSlots, SLOT_CONFIG, timeToMinutes, weekdayOf } from "./lib/slots"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const STALE_PENDING_MS = 24 * 60 * 60 * 1000

const MAX_DURATION_MINUTES = 480

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

		const hours = shop.workingHours?.[weekdayOf(args.date)]
		if (hours?.closed) return []
		const window = {
			startMinute: hours ? timeToMinutes(hours.open) : undefined,
			endMinute: hours ? timeToMinutes(hours.close) : undefined,
		}

		const existing = await ctx.db
			.query("appointments")
			.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", args.date))
			.filter((q) =>
				q.and(q.eq(q.field("barberId"), args.barberId), q.neq(q.field("status"), "cancelled")),
			)
			.collect()

		return generateSlots(
			args.durationMinutes,
			existing,
			window.startMinute !== undefined && window.endMinute !== undefined
				? { startMinute: window.startMinute, endMinute: window.endMinute }
				: undefined,
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
		if (!DATE_RE.test(args.date)) throw new ConvexError("Invalid date format")
		if (!(TIME_RE.test(args.startTime) && TIME_RE.test(args.endTime)))
			throw new ConvexError("Invalid time format")
		if (args.startTime >= args.endTime) throw new ConvexError("Invalid time range")
		if (args.serviceIds.length === 0) throw new ConvexError("At least one service required")

		const services = await Promise.all(args.serviceIds.map((id) => ctx.db.get(id)))
		const totalPrice = services.reduce((sum, s) => {
			if (!s?.isActive) throw new ConvexError("Invalid service")
			if (s.barbershopId !== args.barbershopId) throw new ConvexError("Service not from this shop")
			return sum + s.price
		}, 0)

		const barber = await ctx.db.get(args.barberId)
		if (!barber || barber.barbershopId !== args.barbershopId)
			throw new ConvexError("Invalid barber for this shop")

		const shop = await ctx.db.get(args.barbershopId)
		if (shop?.isActive !== true) throw new ConvexError("Shop is not available")

		const hours = shop.workingHours?.[weekdayOf(args.date)]
		if (hours?.closed) throw new ConvexError("Shop is closed on this date")
		const openMinute = hours ? timeToMinutes(hours.open) : SLOT_CONFIG.START_HOUR * 60
		const closeMinute = hours ? timeToMinutes(hours.close) : SLOT_CONFIG.END_HOUR * 60
		const start = timeToMinutes(args.startTime)
		if (
			start < openMinute ||
			timeToMinutes(args.endTime) > closeMinute ||
			(start - openMinute) % SLOT_CONFIG.INTERVAL_MINUTES !== 0
		)
			throw new ConvexError("Time is outside of operating hours")

		const existing = await ctx.db
			.query("appointments")
			.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", args.date))
			.filter((q) =>
				q.and(q.eq(q.field("barberId"), args.barberId), q.neq(q.field("status"), "cancelled")),
			)
			.collect()

		const conflict = existing.some((a) => args.startTime < a.endTime && args.endTime > a.startTime)
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

		const customer = await ctx.db.get(userId)
		if (customer?.email) {
			// Send the email in a scheduled action so the mutation stays atomic:
			// network I/O never runs inside the transaction and a mutation retry
			// cannot produce a duplicate email.
			await ctx.scheduler.runAfter(0, internal.appointments.sendBookingConfirmationEmail, {
				to: customer.email,
				customerName: customer.name,
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

export const removeUnpaidOrphan = internalMutation({
	args: { id: v.id("appointments") },
	handler: async (ctx, args) => {
		const appt = await ctx.db.get(args.id)
		if (appt?.status !== "pending" || appt.paymentStatus === "paid") return
		await ctx.db.delete(args.id)
	},
})

export const sweepStalePending = internalMutation({
	args: {},
	handler: async (ctx) => {
		const cutoff = Date.now() - STALE_PENDING_MS
		const stale = await ctx.db
			.query("appointments")
			.filter((q) => q.eq(q.field("status"), "pending"))
			.collect()
		for (const appt of stale) {
			if (appt.createdAt < cutoff && appt.paymentStatus !== "paid") {
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
		if (!appt) return
		if (appt.status !== "pending" || appt.paymentStatus === "paid") return
		await ctx.db.delete(appt._id)
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
	args: { customerId: v.optional(v.id("users")) },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx)
		if (!user) return []
		if (args.customerId !== undefined && args.customerId !== user._id) return []

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
	args: { barberId: v.id("barbers"), date: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const barber = await ctx.db.get(args.barberId)
		if (!barber) throw new ConvexError("Barber not found")
		if (barber.userId !== user._id) {
			const shop = await ctx.db.get(barber.barbershopId)
			if (!shop || shop.ownerId !== user._id) throw new ConvexError("Not authorized")
		}

		const appts = await ctx.db
			.query("appointments")
			.withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
			.order("desc")
			.collect()

		const date = args.date
		return date ? appts.filter((a) => a.date === date) : appts
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
		if (!appt) throw new ConvexError("Appointment not found for session")
		if (appt.status !== "pending") return // already confirmed
		await ctx.db.patch(appt._id, { status: "confirmed", paymentStatus: "paid" })
	},
})

export const setPolarCheckout = mutation({
	args: {
		id: v.id("appointments"),
		polarCheckoutId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Not found")
		if (appt.customerId !== user._id) throw new ConvexError("Not authorized")
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

		const isCustomer = appt.customerId === user._id
		if (!isCustomer && user.role !== "admin") {
			const shop = await ctx.db.get(appt.barbershopId)
			if (!shop || shop.ownerId !== user._id) throw new ConvexError("Not authorized")
		}

		if (!DATE_RE.test(args.date)) throw new ConvexError("Invalid date format")
		if (!(TIME_RE.test(args.startTime) && TIME_RE.test(args.endTime)))
			throw new ConvexError("Invalid time format")
		if (args.startTime >= args.endTime) throw new ConvexError("Invalid time range")

		const existing = await ctx.db
			.query("appointments")
			.withIndex("by_shop_date", (q) => q.eq("barbershopId", appt.barbershopId).eq("date", args.date))
			.filter((q) =>
				q.and(
					q.eq(q.field("barberId"), appt.barberId),
					q.neq(q.field("_id"), appt._id),
					q.neq(q.field("status"), "cancelled"),
				),
			)
			.collect()

		const conflict = existing.some((a) => args.startTime < a.endTime && args.endTime > a.startTime)
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
		const [barbershops, barbers, customers] = await Promise.all([
			Promise.all(appts.map((a) => ctx.db.get(a.barbershopId))),
			Promise.all(appts.map((a) => ctx.db.get(a.barberId))),
			Promise.all(appts.map((a) => ctx.db.get(a.customerId))),
		])

		return appts.map((a, i) => ({
			...a,
			shopName: barbershops[i]?.name ?? "—",
			barberName: barbers[i]?.name ?? "—",
			customerName: customers[i]?.name ?? "—",
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
