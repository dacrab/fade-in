import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { definedPatch } from "./validators"

export const getViewer = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return null
		return ctx.db.get(userId)
	},
})

export const getById = query({
	args: { id: v.id("users") },
	handler: async (ctx, args) => ctx.db.get(args.id),
})

export const updateProfile = mutation({
	args: {
		id: v.id("users"),
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")
		if (userId !== args.id) throw new ConvexError("Not authorized")

		const { id, ...fields } = args
		return ctx.db.patch(id, definedPatch(fields))
	},
})

export const toggleFavorite = mutation({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const user = await ctx.db.get(userId)
		if (!user) throw new ConvexError("Not found")

		const favorites = user.favoriteShopIds ?? []
		const exists = favorites.some((id) => id === args.barbershopId)

		return ctx.db.patch(userId, {
			favoriteShopIds: exists
				? favorites.filter((id) => id !== args.barbershopId)
				: [...favorites, args.barbershopId],
		})
	},
})

/** Admin only — returns all users. */
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []
		const user = await ctx.db.get(userId)
		if (user?.role !== "admin") return []
		return ctx.db.query("users").collect()
	},
})
