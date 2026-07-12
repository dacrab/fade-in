import { getAuthUserId } from "@convex-dev/auth/server"
import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { definedPatch, socialLinksValidator, workingHoursValidator } from "./validators"

/** Lists active barbershops with filters applied at the DB level where possible. */
export const list = query({
	args: {
		city: v.optional(v.string()),
		search: v.optional(v.string()),
		minRating: v.optional(v.number()),
		isVerified: v.optional(v.boolean()),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const getBaseQuery = () => {
			if (args.city) {
				return ctx.db
					.query("barbershops")
					.withIndex("by_city", (q) => q.eq("city", args.city as string))
					.filter((q) => q.eq(q.field("isActive"), true))
			}
			return ctx.db.query("barbershops").withIndex("by_active", (q) => q.eq("isActive", true))
		}

		let baseQuery = getBaseQuery()

		// Apply filters that can be done at DB level
		if (args.minRating !== undefined) {
			baseQuery = baseQuery.filter((q) => q.gte(q.field("rating"), args.minRating as number))
		}
		if (args.isVerified !== undefined) {
			baseQuery = baseQuery.filter((q) => q.eq(q.field("isVerified"), args.isVerified as boolean))
		}

		// For search, we must still post-filter but do it BEFORE pagination
		if (args.search) {
			const term = args.search.toLowerCase()
			const all = await baseQuery.collect()
			const filtered = all.filter(
				(s) =>
					s.name.toLowerCase().includes(term) ||
					s.city.toLowerCase().includes(term) ||
					s.address.toLowerCase().includes(term),
			)
			// Manual offset-based cursor pagination over filtered results
			const numItems = args.paginationOpts.numItems
			const startIdx = args.paginationOpts.cursor ? Number(args.paginationOpts.cursor) || 0 : 0
			const page = filtered.slice(startIdx, startIdx + numItems)
			const nextIdx = startIdx + numItems
			return {
				page,
				isDone: nextIdx >= filtered.length,
				continueCursor: nextIdx >= filtered.length ? null : String(nextIdx),
			}
		}

		return baseQuery.paginate(args.paginationOpts)
	},
})

/** Returns top-rated verified shops. */
export const getFeatured = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 6
		// Collect verified active shops and sort by rating
		const shops = await ctx.db
			.query("barbershops")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.filter((q) => q.eq(q.field("isVerified"), true))
			.collect()

		return shops.sort((a, b) => b.rating - a.rating).slice(0, limit)
	},
})

export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		return ctx.db
			.query("barbershops")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first()
	},
})

export const getById = query({
	args: { id: v.id("barbershops") },
	handler: async (ctx, args) => ctx.db.get(args.id),
})

export const listByOwner = query({
	args: { ownerId: v.id("users") },
	handler: async (ctx, args) => {
		return ctx.db
			.query("barbershops")
			.withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
			.collect()
	},
})

/** Creates a new barbershop. ownerId derived from auth. Slug uniqueness enforced. */
export const create = mutation({
	args: {
		name: v.string(),
		slug: v.string(),
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

		// Enforce slug uniqueness
		const existing = await ctx.db
			.query("barbershops")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first()
		if (existing) throw new ConvexError("A shop with this URL already exists")

		const { images, ...rest } = args
		return ctx.db.insert("barbershops", {
			...rest,
			ownerId: userId,
			images: images ?? [],
			rating: 0,
			reviewCount: 0,
			isVerified: false,
			isActive: true,
		})
	},
})

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

		const { id, ...fields } = args
		return ctx.db.patch(id, definedPatch(fields))
	},
})

export const verify = mutation({
	args: { id: v.id("barbershops"), isVerified: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")
		const user = await ctx.db.get(userId)
		if (user?.role !== "admin") throw new ConvexError("Not authorized")
		return ctx.db.patch(args.id, { isVerified: args.isVerified })
	},
})

export const suspend = mutation({
	args: { id: v.id("barbershops"), isActive: v.boolean() },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")
		const user = await ctx.db.get(userId)
		if (user?.role !== "admin") throw new ConvexError("Not authorized")
		return ctx.db.patch(args.id, { isActive: args.isActive })
	},
})

export const listByIds = query({
	args: { ids: v.array(v.id("barbershops")) },
	handler: async (ctx, args) => {
		const shops = await Promise.all(args.ids.map((id) => ctx.db.get(id)))
		return shops.filter(Boolean)
	},
})

/** Admin only — returns all shops. */
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []
		const user = await ctx.db.get(userId)
		if (user?.role !== "admin") return []
		return ctx.db.query("barbershops").collect()
	},
})

/** Platform stats for homepage — lightweight aggregation. */
export const getStats = query({
	args: {},
	handler: async (ctx) => {
		const shops = await ctx.db
			.query("barbershops")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect()

		const avgRating =
			shops.length > 0
				? Math.round((shops.reduce((sum, s) => sum + s.rating, 0) / shops.length) * 10) / 10
				: 0

		// Count unique customers from users table instead of scanning all appointments
		const customers = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("role"), "customer"))
			.collect()

		return {
			shopCount: shops.length,
			customerCount: customers.length,
			avgRating,
		}
	},
})
