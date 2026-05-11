import { v } from "convex/values"
import { generateSlots } from "../src/lib/slots"
import { mutation, query } from "./_generated/server"

export const getAvailableSlots = query({
	args: {
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		date: v.string(),
		durationMinutes: v.number(),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("appointments")
			.withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
			.filter((q) => q.and(q.eq(q.field("date"), args.date), q.neq(q.field("status"), "cancelled")))
			.collect()

		return generateSlots(args.durationMinutes, existing)
	},
})

/** Creates a new appointment with pending status. */
export const create = mutation({
	args: {
		customerId: v.id("users"),
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		serviceIds: v.array(v.id("services")),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		totalPrice: v.number(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return ctx.db.insert("appointments", {
			...args,
			status: "pending",
			createdAt: Date.now(),
		})
	},
})

/** Updates the status of an appointment. */
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
		return ctx.db.patch(args.id, { status: args.status })
	},
})

/** Returns all appointments for a customer, ordered by most recent first. */
export const listByCustomer = query({
	args: { customerId: v.id("users") },
	handler: async (ctx, args) => {
		return ctx.db
			.query("appointments")
			.withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
			.order("desc")
			.collect()
	},
})

/** Returns all appointments for a shop, optionally filtered by date. */
export const listByShop = query({
	args: {
		barbershopId: v.id("barbershops"),
		date: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const appts = await ctx.db
			.query("appointments")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.order("desc")
			.collect()

		return args.date ? appts.filter((a) => a.date === args.date) : appts
	},
})

/** Returns all appointments for a barber, optionally filtered by date. */
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
