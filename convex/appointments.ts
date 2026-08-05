import { ConvexError, v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import { getCurrentUser, requireAdmin, requireOwner, requireUser } from "./lib/auth"
import { sendEmail } from "./lib/email"
import { computeServiceTotal } from "./lib/services"
import { generateSlots } from "./lib/slots"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

export const getAvailableSlots = query({
	args: {
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		date: v.string(),
		durationMinutes: v.number(),
	},
	handler: async (ctx, args) => {
		if (!DATE_RE.test(args.date)) throw new ConvexError("Invalid date format")
		if (args.durationMinutes < 1 || args.durationMinutes > 480)
			throw new ConvexError("Invalid duration")

		const existing = await ctx.db
			.query("appointments")
			.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", args.date))
			.filter((q) =>
				q.and(q.eq(q.field("barberId"), args.barberId), q.neq(q.field("status"), "cancelled")),
			)
			.collect()

		return generateSlots(args.durationMinutes, existing)
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

		const totalPrice = await computeServiceTotal(
			(id) => ctx.db.get(id),
			args.serviceIds,
			args.barbershopId,
		)

		const barber = await ctx.db.get(args.barberId)
		if (!barber || barber.barbershopId !== args.barbershopId)
			throw new ConvexError("Invalid barber for this shop")

		const shop = await ctx.db.get(args.barbershopId)
		if (!shop || shop.isActive !== true) throw new ConvexError("Shop is not available")

		const existing = await ctx.db
			.query("appointments")
			.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", args.date))
			.filter((q) =>
				q.and(q.eq(q.field("barberId"), args.barberId), q.neq(q.field("status"), "cancelled")),
			)
			.collect()

		const conflict = existing.some((a) => args.startTime < a.endTime && args.endTime > a.startTime)
		if (conflict) throw new ConvexError("This time slot is no longer available.")

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

		try {
			const [customer, shop, barber] = await Promise.all([
				ctx.db.get(userId),
				ctx.db.get(args.barbershopId),
				ctx.db.get(args.barberId),
			])
			if (customer?.email) {
				await sendEmail(
					customer.email,
					`Booking Confirmed — ${shop?.name ?? "Barbershop"}`,
					`<p>Hi ${customer.name ?? "there"},</p>
					<p>Your booking at <strong>${shop?.name ?? "Barbershop"}</strong> is confirmed!</p>
					<p><strong>Barber:</strong> ${barber?.name ?? "—"}<br>
					<strong>Date:</strong> ${args.date}<br>
					<strong>Time:</strong> ${args.startTime} – ${args.endTime}<br>
					<strong>Total:</strong> €${(totalPrice / 100).toFixed(2)}</p>
					<p>See you there!<br>— The FadeIn Team</p>`,
				)
			}
		} catch {}

		return { appointmentId, totalPrice }
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
	args: { customerId: v.id("users") },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx)
		if (!user || user._id !== args.customerId) return []

		return ctx.db
			.query("appointments")
			.withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
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
		const thisMonth = new Date().toISOString().slice(0, 7)

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
