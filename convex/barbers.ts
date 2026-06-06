import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { definedPatch, workingHoursValidator } from "./validators"

export const listByShop = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		return ctx.db
			.query("barbers")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect()
	},
})

export const getByUserId = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const barbers = await ctx.db
			.query("barbers")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect()
		return barbers[0] ?? null
	},
})

export const create = mutation({
	args: {
		barbershopId: v.id("barbershops"),
		name: v.string(),
		bio: v.optional(v.string()),
		specializations: v.optional(v.array(v.string())),
		avatarUrl: v.optional(v.string()),
		workingHours: workingHoursValidator,
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const shop = await ctx.db.get(args.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		const { specializations, ...rest } = args
		return ctx.db.insert("barbers", {
			...rest,
			specializations: specializations ?? [],
			isActive: true,
		})
	},
})

export const linkToUser = mutation({
	args: { barberId: v.id("barbers") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const barber = await ctx.db.get(args.barberId)
		if (!barber) throw new ConvexError("Barber not found")

		// Only the shop owner or the barber themselves can link
		const shop = await ctx.db.get(barber.barbershopId)
		if (!shop) throw new ConvexError("Shop not found")

		const user = await ctx.db.get(userId)
		if (shop.ownerId !== userId && user?.role !== "admin" && user?.role !== "barber")
			throw new ConvexError("Not authorized")

		return ctx.db.patch(args.barberId, { userId })
	},
})

export const update = mutation({
	args: {
		id: v.id("barbers"),
		name: v.optional(v.string()),
		bio: v.optional(v.string()),
		specializations: v.optional(v.array(v.string())),
		avatarUrl: v.optional(v.string()),
		userId: v.optional(v.id("users")),
		workingHours: workingHoursValidator,
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const barber = await ctx.db.get(args.id)
		if (!barber) throw new ConvexError("Not found")

		const shop = await ctx.db.get(barber.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		const { id, ...fields } = args
		return ctx.db.patch(id, definedPatch(fields))
	},
})

export const remove = mutation({
	args: { id: v.id("barbers") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const barber = await ctx.db.get(args.id)
		if (!barber) throw new ConvexError("Not found")

		const shop = await ctx.db.get(barber.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, { isActive: false })
	},
})
