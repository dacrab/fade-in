import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUser, requireAdmin, requireUser } from "./lib/auth"
import { MAX_LIST_ROWS } from "./lib/limits"
import { definedPatch } from "./validators"

export const getViewer = query({
	args: {},
	handler: async (ctx) => getCurrentUser(ctx),
})

export const updateProfile = mutation({
	args: {
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		return ctx.db.patch(user._id, definedPatch(args))
	},
})

export const ensureCurrentUser = mutation({
	args: { role: v.optional(v.literal("owner")) },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) throw new ConvexError("Not authenticated")
		const clerkId = identity.subject
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first()
		if (existing) {
			// Promote a plain customer who signed up as an owner, but never
			// downgrade an admin or barber role.
			if (args.role === "owner" && existing.role === "customer") {
				await ctx.db.patch(existing._id, { role: "owner" })
				return { ...existing, role: "owner" as const }
			}
			return existing
		}
		const newId = await ctx.db.insert("users", {
			clerkId,
			email: identity.email ?? "",
			name: identity.name ?? identity.email ?? "",
			role: args.role ?? "customer",
			avatarUrl: identity.pictureUrl ?? undefined,
		})
		const created = await ctx.db.get(newId)
		if (!created) throw new ConvexError("Failed to create user")
		return created
	},
})

export const toggleFavorite = mutation({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)

		const shop = await ctx.db.get(args.barbershopId)
		if (!shop?.isActive) throw new ConvexError("Shop is not available")

		const favorites = user.favoriteShopIds ?? []
		const exists = favorites.some((id) => id === args.barbershopId)

		return ctx.db.patch(user._id, {
			favoriteShopIds: exists
				? favorites.filter((id) => id !== args.barbershopId)
				: [...favorites, args.barbershopId],
		})
	},
})

export const listAll = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx)
		return ctx.db.query("users").take(MAX_LIST_ROWS)
	},
})
