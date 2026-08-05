import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUser, requireAdmin, requireUser } from "./lib/auth"
import { definedPatch } from "./validators"

export const getViewer = query({
	args: {},
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx)
		return user ? ctx.db.get(user._id) : null
	},
})

export const updateProfile = mutation({
	args: {
		id: v.id("users"),
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		if (user._id !== args.id) throw new ConvexError("Not authorized")

		const { id, ...fields } = args
		return ctx.db.patch(id, definedPatch(fields))
	},
})

export const toggleFavorite = mutation({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)

		const favorites = user.favoriteShopIds ?? []
		const exists = favorites.some((id) => id === args.barbershopId)

		return ctx.db.patch(user._id, {
			favoriteShopIds: exists
				? favorites.filter((id) => id !== args.barbershopId)
				: [...favorites, args.barbershopId],
		})
	},
})

export const ensureCurrentUser = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) throw new ConvexError("Not authenticated")
		const clerkId = identity.subject
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first()
		if (existing) return existing
		const newId = await ctx.db.insert("users", {
			clerkId,
			email: identity.email ?? "",
			name: identity.name ?? identity.email ?? "",
			role: "customer",
			avatarUrl: identity.pictureUrl ?? undefined,
		})
		return ctx.db.get(newId)
	},
})

export const listAll = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx)
		return ctx.db.query("users").collect()
	},
})
