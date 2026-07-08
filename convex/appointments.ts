import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { generateSlots } from "../src/lib/slots"
import { mutation, query } from "./_generated/server"
import { sendEmail } from "./lib/email"

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
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")
		if (!DATE_RE.test(args.date)) throw new ConvexError("Invalid date format")
		if (!(TIME_RE.test(args.startTime) && TIME_RE.test(args.endTime)))
			throw new ConvexError("Invalid time format")
		if (args.serviceIds.length === 0) throw new ConvexError("At least one service required")

		// Compute price server-side from services
		const services = await Promise.all(args.serviceIds.map((id) => ctx.db.get(id)))
		const totalPrice = services.reduce((sum, s) => {
			if (!s?.isActive) throw new ConvexError("Invalid service")
			if (s.barbershopId !== args.barbershopId) throw new ConvexError("Service not from this shop")
			return sum + s.price
		}, 0)

		// Validate slot is still available
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

		// Send booking confirmation email (best-effort)
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
		} catch {
			// Email failure should not block the booking
		}

		return appointmentId
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
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Not found")

		// Customer can only cancel their own appointments
		if (appt.customerId === userId) {
			if (args.status !== "cancelled") throw new ConvexError("Customers can only cancel appointments")
			return ctx.db.patch(args.id, { status: args.status })
		}

		// Shop owner can confirm/complete/cancel
		const shop = await ctx.db.get(appt.barbershopId)
		if (!shop) throw new ConvexError("Shop not found")

		const user = await ctx.db.get(userId)
		if (shop.ownerId === userId || user?.role === "admin") {
			return ctx.db.patch(args.id, { status: args.status })
		}

		throw new ConvexError("Not authorized")
	},
})

export const listByCustomer = query({
	args: { customerId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId || userId !== args.customerId) return []

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
		const appts = await ctx.db
			.query("appointments")
			.withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
			.order("desc")
			.collect()

		const date = args.date
		return date ? appts.filter((a) => a.date === date) : appts
	},
})

export const confirmFromCheckout = mutation({
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
		await ctx.db.patch(args.id, {
			polarCheckoutId: args.polarCheckoutId,
			paymentStatus: "unpaid",
		})
	},
})

/** Server-side stats for business dashboard — avoids loading all appointments client-side */
export const getShopStats = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
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

export const getById = query({
	args: { id: v.id("appointments") },
	handler: async (ctx, args) => ctx.db.get(args.id),
})

export const reschedule = mutation({
	args: {
		id: v.id("appointments"),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Not found")
		if (appt.customerId !== userId) throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, {
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
		})
	},
})

/** Admin: returns all appointments with customer/shop/barber names for the data table. */
export const listAllWithDetails = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []
		const user = await ctx.db.get(userId)
		if (user?.role !== "admin") return []

		const all = await ctx.db.query("appointments").order("desc").collect()
		type DocRef = { _id: string; name?: string }
		const customers = new Map(
			((await Promise.all(all.map((a) => ctx.db.get(a.customerId)))) as (DocRef | undefined)[])
				.filter((u): u is DocRef => u != null)
				.map((u) => [u._id, u]),
		)
		const shops = new Map(
			((await Promise.all(all.map((a) => ctx.db.get(a.barbershopId)))) as (DocRef | undefined)[])
				.filter((s): s is DocRef => s != null)
				.map((s) => [s._id, s]),
		)
		const barbers = new Map(
			((await Promise.all(all.map((a) => ctx.db.get(a.barberId)))) as (DocRef | undefined)[])
				.filter((b): b is DocRef => b != null)
				.map((b) => [b._id, b]),
		)

		return all.map((a) => ({
			_id: a._id,
			date: a.date,
			startTime: a.startTime,
			endTime: a.endTime,
			totalPrice: a.totalPrice,
			status: a.status,
			paymentStatus: a.paymentStatus,
			shopName: shops.get(a.barbershopId)?.name ?? "—",
			barberName: barbers.get(a.barberId)?.name ?? "—",
			customerName: customers.get(a.customerId)?.name ?? "—",
		}))
	},
})
