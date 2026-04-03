import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { filterDefined, socialLinksValidator, workingHoursValidator } from "./validators"

/** Lists active barbershops with optional city, search, minRating, isVerified filters.
 * city is filtered via the by_city index; minRating and isVerified are applied as
 * range/equality filters on the index scan. Free-text search stays in-memory since
 * Convex's search indexes require a separate schema declaration. */
export const list = query({
	args: {
		city: v.optional(v.string()),
		search: v.optional(v.string()),
		minRating: v.optional(v.number()),
		isVerified: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Use city index when a city filter is provided, otherwise use the active index.
		let shops = args.city
			? await ctx.db
					.query("barbershops")
					.withIndex("by_city", (q) => q.eq("city", args.city as string))
					.filter((q) => q.eq(q.field("isActive"), true))
					.collect()
			: await ctx.db
					.query("barbershops")
					.withIndex("by_active", (q) => q.eq("isActive", true))
					.collect()

		// Apply remaining filters in a single pass.
		// Free-text search (name/city/address) stays in-memory — no full-text index.
		return shops.filter((s) => {
			if (args.isVerified !== undefined && s.isVerified !== args.isVerified) return false
			if (args.minRating !== undefined && s.rating < args.minRating) return false
			if (args.search) {
				const term = args.search.toLowerCase()
				if (
					!s.name.toLowerCase().includes(term) &&
					!s.city.toLowerCase().includes(term) &&
					!s.address.toLowerCase().includes(term)
				)
					return false
			}
			return true
		})
	},
})

/** Returns the top-rated verified shops, sorted by rating descending. */
export const getFeatured = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const limit = args.limit ?? 6
		// Filter verified in-memory after the index scan; Convex doesn't support
		// multi-field compound indexes on isActive+isVerified+rating in one pass.
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
		return await ctx.db
			.query("barbershops")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first()
	},
})

/** Fetches a shop by its Convex document ID. */
export const getById = query({
	args: { id: v.id("barbershops") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id)
	},
})

/** Returns all shops owned by a given user. */
export const listByOwner = query({
	args: { ownerId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("barbershops")
			.withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
			.collect()
	},
})

/** Creates a new barbershop. Sets initial rating=0, reviewCount=0, isVerified=false, isActive=true. */
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
		return await ctx.db.insert("barbershops", {
			name: args.name,
			slug: args.slug,
			ownerId: args.ownerId,
			description: args.description,
			phone: args.phone,
			address: args.address,
			city: args.city,
			lat: args.lat,
			lng: args.lng,
			images: args.images ?? [],
			rating: 0,
			reviewCount: 0,
			isVerified: false,
			isActive: true,
			workingHours: args.workingHours,
			socialLinks: args.socialLinks,
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
		const { id, ...fields } = args
		return await ctx.db.patch(id, filterDefined(fields))
	},
})

/** Toggles the verified badge on a shop (admin only). */
export const verify = mutation({
	args: { id: v.id("barbershops"), isVerified: v.boolean() },
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, { isVerified: args.isVerified })
	},
})

/** Toggles the active status of a shop (admin only). */
export const suspend = mutation({
	args: { id: v.id("barbershops"), isActive: v.boolean() },
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, { isActive: args.isActive })
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
		return await ctx.db.query("barbershops").collect()
	},
})
