import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { definedPatch } from "./validators"

export const getById = query({
	args: { id: v.id("services") },
	handler: async (ctx, args) => ctx.db.get(args.id),
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
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

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
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

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
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const service = await ctx.db.get(args.id)
		if (!service) throw new ConvexError("Not found")

		const shop = await ctx.db.get(service.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, { isActive: false })
	},
})
