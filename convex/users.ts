import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

/** Returns the currently authenticated user, or null if not logged in. */
export const getViewer = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return null
		return ctx.db.get(userId)
	},
})

/** Fetches a user by ID. */
export const getById = query({
	args: { id: v.id("users") },
	handler: async (ctx, args) => {
		return ctx.db.get(args.id)
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
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")
		if (userId !== args.id) throw new ConvexError("Not authorized")

		const { id, name, phone, avatarUrl } = args
		return ctx.db.patch(id, {
			...(name !== undefined && { name }),
			...(phone !== undefined && { phone }),
			...(avatarUrl !== undefined && { avatarUrl }),
		})
	},
})

/** Returns all users (admin only). */
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		return ctx.db.query("users").collect()
	},
})

/** Toggles a barbershop in the user's favorites list. */
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

/** Returns the user's favorited barbershops. */
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

/** Checks if the current user's email is verified. */
export const isEmailVerified = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return false

		const user = await ctx.db.get(userId)
		return user?.emailVerified ?? false
	},
})

/** Sets the current user's email as verified. */
export const verifyEmail = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		await ctx.db.patch(userId, { emailVerified: true })
	},
})
