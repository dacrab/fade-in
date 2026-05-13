import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

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
		const patch: Record<string, unknown> = {}
		for (const [key, val] of Object.entries(fields)) {
			if (val !== undefined) patch[key] = val
		}
		return ctx.db.patch(id, patch)
	},
})

/** Admin only — returns all users. */
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []
		const user = await ctx.db.get(userId)
		if (!user || user.role !== "admin") return []
		return ctx.db.query("users").collect()
	},
})

export const toggleFavorite = mutation({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const user = await ctx.db.get(userId)
		if (!user) throw new ConvexError("User not found")

		const favorites = user.favoriteShopIds ?? []
		const index = favorites.indexOf(args.barbershopId)
		const updated =
			index === -1
				? [...favorites, args.barbershopId]
				: favorites.filter((id) => id !== args.barbershopId)

		await ctx.db.patch(userId, { favoriteShopIds: updated })
		return index === -1
	},
})

export const getFavorites = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []
		const user = await ctx.db.get(userId)
		if (!user) return []
		const shops = await Promise.all((user.favoriteShopIds ?? []).map((id) => ctx.db.get(id)))
		return shops.filter(Boolean)
	},
})
