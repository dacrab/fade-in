import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { generateSlots } from "../src/lib/slots"
import { mutation, query } from "./_generated/server"

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

		return ctx.db.insert("appointments", {
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
		if (args.date) {
			return ctx.db
				.query("appointments")
				.withIndex("by_shop_date", (q) =>
					q.eq("barbershopId", args.barbershopId).eq("date", args.date as string),
				)
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

		return args.date ? appts.filter((a) => a.date === args.date) : appts
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
