import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { filterDefined } from "./validators"

/** Returns the currently authenticated user, or null if not logged in. */
export const getViewer = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return null
		return await ctx.db.get(userId)
	},
})

/** Fetches a user by ID. */
export const getById = query({
	args: { id: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id)
	},
})

/** Partially updates a user's profile; only provided (non-undefined) fields are written. */
export const updateProfile = mutation({
	args: {
		id: v.id("users"),
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...fields } = args
		return await ctx.db.patch(id, filterDefined(fields))
	},
})

/** Adds or removes a shop from a user's favorite list. */
export const toggleFavorite = mutation({
	args: {
		userId: v.id("users"),
		shopId: v.id("barbershops"),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId)
		if (!user) throw new Error("User not found")
		const already = user.favoriteShopIds.includes(args.shopId)
		return await ctx.db.patch(args.userId, {
			favoriteShopIds: already
				? user.favoriteShopIds.filter((id) => id !== args.shopId)
				: [...user.favoriteShopIds, args.shopId],
		})
	},
})

/** Returns all users (admin only). */
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("users").collect()
	},
})
