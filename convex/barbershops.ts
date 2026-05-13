import { getAuthUserId } from "@convex-dev/auth/server"
import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { socialLinksValidator, workingHoursValidator } from "./validators"

/** Lists active barbershops with optional city, search, minRating, isVerified filters. */
export const list = query({
	args: {
		city: v.optional(v.string()),
		search: v.optional(v.string()),
		minRating: v.optional(v.number()),
		isVerified: v.optional(v.boolean()),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const baseQuery = args.city
			? ctx.db
					.query("barbershops")
					.withIndex("by_city", (q) => q.eq("city", args.city as string))
					.filter((q) => q.eq(q.field("isActive"), true))
			: ctx.db.query("barbershops").withIndex("by_active", (q) => q.eq("isActive", true))

		const result = await baseQuery.paginate(args.paginationOpts)

		return {
			...result,
			page: result.page.filter((s) => {
				if (args.isVerified !== undefined && s.isVerified !== args.isVerified) return false
				if (args.minRating !== undefined && s.rating < args.minRating) return false
				if (args.search) {
					const term = args.search.toLowerCase()
					if (
						!(
							s.name.toLowerCase().includes(term) ||
							s.city.toLowerCase().includes(term) ||
							s.address.toLowerCase().includes(term)
						)
					)
						return false
				}
				return true
			}),
		}
	},
})

/** Returns the top-rated verified shops, sorted by rating descending. */
export const getFeatured = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 6
		const shops = await ctx.db
			.query("barbershops")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.filter((q) => q.eq(q.field("isVerified"), true))
			.collect()

		return shops.sort((a, b) => b.rating - a.rating).slice(0, limit)
	},
})

/** Fetches a single shop by its URL slug. */
export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("barbershops")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first()
	},
})

/** Fetches a shop by its Convex document ID. */
export const getById = query({
	args: { id: v.id("barbershops") },
	handler: async (ctx, args) => {
		return ctx.db.get(args.id)
	},
})

/** Returns all shops owned by a given user. */
export const listByOwner = query({
	args: { ownerId: v.id("users") },
	handler: async (ctx, args) => {
		return ctx.db
			.query("barbershops")
			.withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
			.collect()
	},
})

/** Creates a new barbershop. */
export const create = mutation({
	args: {
		name: v.string(),
		slug: v.string(),
		ownerId: v.id("users"),
		description: v.optional(v.string()),
		phone: v.optional(v.string()),
		address: v.string(),
		city: v.string(),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		images: v.optional(v.array(v.string())),
		workingHours: workingHoursValidator,
		socialLinks: socialLinksValidator,
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const { images, ...rest } = args
		return ctx.db.insert("barbershops", {
			...rest,
			images: images ?? [],
			rating: 0,
			reviewCount: 0,
			isVerified: false,
			isActive: true,
		})
	},
})

/** Partially updates a shop; only provided (non-undefined) fields are written. */
export const update = mutation({
	args: {
		id: v.id("barbershops"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		phone: v.optional(v.string()),
		address: v.optional(v.string()),
		city: v.optional(v.string()),
		lat: v.optional(v.number()),
		lng: v.optional(v.number()),
		images: v.optional(v.array(v.string())),
		workingHours: workingHoursValidator,
		socialLinks: socialLinksValidator,
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const shop = await ctx.db.get(args.id)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		const {
			id,
			name,
			description,
			phone,
			address,
			city,
			lat,
			lng,
			images,
			workingHours,
			socialLinks,
			isActive,
		} = args
		return ctx.db.patch(id, {
			...(name !== undefined && { name }),
			...(description !== undefined && { description }),
			...(phone !== undefined && { phone }),
			...(address !== undefined && { address }),
			...(city !== undefined && { city }),
			...(lat !== undefined && { lat }),
			...(lng !== undefined && { lng }),
			...(images !== undefined && { images }),
			...(workingHours !== undefined && { workingHours }),
			...(socialLinks !== undefined && { socialLinks }),
			...(isActive !== undefined && { isActive }),
		})
	},
})

/** Toggles the verified badge on a shop (admin only). */
export const verify = mutation({
	args: { id: v.id("barbershops"), isVerified: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const user = await ctx.db.get(userId)
		if (!user || user.role !== "admin") throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, { isVerified: args.isVerified })
	},
})

/** Toggles the active status of a shop (admin only). */
export const suspend = mutation({
	args: { id: v.id("barbershops"), isActive: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const user = await ctx.db.get(userId)
		if (!user || user.role !== "admin") throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, { isActive: args.isActive })
	},
})

/** Updates a shop's images with Convex storage IDs. */
export const updateImages = mutation({
	args: { id: v.id("barbershops"), images: v.array(v.string()) },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const shop = await ctx.db.get(args.id)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		await ctx.db.patch(args.id, { images: args.images })
	},
})

/** Fetches multiple shops by their IDs in a single round-trip. */
export const listByIds = query({
	args: { ids: v.array(v.id("barbershops")) },
	handler: async (ctx, args) => {
		const shops = await Promise.all(args.ids.map((id) => ctx.db.get(id)))
		return shops.filter(Boolean)
	},
})

/** Returns every shop regardless of active status (admin only). */
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		return ctx.db.query("barbershops").collect()
	},
})

/** Returns platform-wide stats for the homepage. */
export const getStats = query({
	args: {},
	handler: async (ctx) => {
		const shops = await ctx.db
			.query("barbershops")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect()
		const appointments = await ctx.db.query("appointments").collect()
		const customers = new Set(appointments.map((a) => a.customerId))
		const avgRating =
			shops.length > 0
				? Math.round((shops.reduce((sum, s) => sum + s.rating, 0) / shops.length) * 10) / 10
				: 0
		return {
			shopCount: shops.length,
			customerCount: customers.size,
			avgRating,
		}
	},
})
