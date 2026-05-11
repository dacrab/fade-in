import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
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
