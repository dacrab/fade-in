import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUser } from "./lib/auth"
import { definedPatch } from "./validators"

const MAX_DURATION_MINUTES = 480

function validatePriceDuration(price: number, durationMinutes: number) {
	if (!(price > 0)) throw new ConvexError("Price must be greater than zero")
	if (durationMinutes < 1 || durationMinutes > MAX_DURATION_MINUTES)
		throw new ConvexError("Invalid duration")
}

export const getById = query({
	args: { id: v.id("services") },
	handler: async (ctx, args) => {
		await requireUser(ctx)
		return ctx.db.get(args.id)
	},
})

export const listByShop = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		return ctx.db
			.query("services")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect()
	},
})

export const create = mutation({
	args: {
		barbershopId: v.id("barbershops"),
		name: v.string(),
		description: v.optional(v.string()),
		price: v.number(),
		durationMinutes: v.number(),
		category: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const userId = user._id
		validatePriceDuration(args.price, args.durationMinutes)

		const shop = await ctx.db.get(args.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		return ctx.db.insert("services", {
			...args,
			isActive: true,
		})
	},
})

export const update = mutation({
	args: {
		id: v.id("services"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		price: v.optional(v.number()),
		durationMinutes: v.optional(v.number()),
		category: v.optional(v.string()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const userId = user._id
		if (args.price !== undefined && args.durationMinutes !== undefined)
			validatePriceDuration(args.price, args.durationMinutes)

		const service = await ctx.db.get(args.id)
		if (!service) throw new ConvexError("Not found")

		const shop = await ctx.db.get(service.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		const { id, ...fields } = args
		return ctx.db.patch(id, definedPatch(fields))
	},
})

export const remove = mutation({
	args: { id: v.id("services") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const userId = user._id

		const service = await ctx.db.get(args.id)
		if (!service) throw new ConvexError("Not found")

		const shop = await ctx.db.get(service.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, { isActive: false })
	},
})
