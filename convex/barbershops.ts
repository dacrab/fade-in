import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUser, requireAdmin, requireUser } from "./lib/auth"
import { slugify } from "./lib/slug"
import {
	assertValidWorkingHours,
	definedPatch,
	socialLinksValidator,
	workingHoursValidator,
} from "./validators"

export const list = query({
	args: {
		city: v.optional(v.string()),
		search: v.optional(v.string()),
		minRating: v.optional(v.number()),
		isVerified: v.optional(v.boolean()),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const city = args.city
		const minRating = args.minRating
		const isVerified = args.isVerified

		if (args.search) {
			const term = args.search
			let searchQuery = ctx.db.query("barbershops").withSearchIndex("search_name", (q) => {
				let filtered = q.search("name", term)
				if (city) filtered = filtered.eq("city", city)
				return filtered.eq("isActive", true)
			})
			if (minRating !== undefined) {
				searchQuery = searchQuery.filter((q) => q.gte(q.field("rating"), minRating))
			}
			if (isVerified !== undefined) {
				searchQuery = searchQuery.filter((q) => q.eq(q.field("isVerified"), isVerified))
			}
			return searchQuery.paginate(args.paginationOpts)
		}

		const getBaseQuery = () => {
			if (city) {
				return ctx.db
					.query("barbershops")
					.withIndex("by_city", (q) => q.eq("city", city))
					.filter((q) => q.eq(q.field("isActive"), true))
			}
			return ctx.db.query("barbershops").withIndex("by_active", (q) => q.eq("isActive", true))
		}

		let baseQuery = getBaseQuery()

		if (minRating !== undefined) {
			baseQuery = baseQuery.filter((q) => q.gte(q.field("rating"), minRating))
		}
		if (isVerified !== undefined) {
			baseQuery = baseQuery.filter((q) => q.eq(q.field("isVerified"), isVerified))
		}

		return baseQuery.paginate(args.paginationOpts)
	},
})

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
	args: { ownerId: v.optional(v.id("users")) },
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx)
		if (!user) return []
		if (args.ownerId !== undefined && args.ownerId !== user._id) return []
		return ctx.db
			.query("barbershops")
			.withIndex("by_owner", (q) => q.eq("ownerId", user._id))
			.collect()
	},
})

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
		const user = await requireUser(ctx)
		const userId = user._id
		assertValidWorkingHours(args.workingHours)

		const slug = slugify(args.slug)
		if (!slug) throw new ConvexError("Invalid shop slug")

		// Check-then-insert runs inside a single mutation: Convex executes it
		// atomically and retries on concurrent writes, so a duplicate slug cannot
		// slip through. (Convex has no native unique constraints / onConflict.)
		const existing = await ctx.db
			.query("barbershops")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.first()
		if (existing) throw new ConvexError("A shop with this URL already exists")

		const { images, ...rest } = args
		const shopId = await ctx.db.insert("barbershops", {
			...rest,
			slug,
			ownerId: userId,
			images: images ?? [],
			rating: 0,
			reviewCount: 0,
			isVerified: false,
			isActive: true,
		})
		if (user.role === "customer") {
			await ctx.db.patch(userId, { role: "owner" })
		}
		return shopId
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
		const user = await requireUser(ctx)
		const userId = user._id

		assertValidWorkingHours(args.workingHours)

		const shop = await ctx.db.get(args.id)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		const { id, ...fields } = args
		return ctx.db.patch(id, definedPatch(fields))
	},
})

export const verify = mutation({
	args: { id: v.id("barbershops"), isVerified: v.boolean() },
	handler: async (ctx, args) => {
		await requireAdmin(ctx)
		return ctx.db.patch(args.id, { isVerified: args.isVerified })
	},
})

export const suspend = mutation({
	args: { id: v.id("barbershops"), isActive: v.boolean() },
	handler: async (ctx, args) => {
		await requireAdmin(ctx)
		return ctx.db.patch(args.id, { isActive: args.isActive })
	},
})

export const listByIds = query({
	args: { ids: v.array(v.id("barbershops")) },
	handler: async (ctx, args) => {
		const shops = await Promise.all(args.ids.map((id) => ctx.db.get(id)))
		return shops.filter((s) => s?.isActive === true)
	},
})

export const listAll = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx)
		return ctx.db.query("barbershops").collect()
	},
})

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

		const customers = await ctx.db
			.query("users")
			.withIndex("by_role", (q) => q.eq("role", "customer"))
			.collect()

		return {
			shopCount: shops.length,
			customerCount: customers.length,
			avgRating,
		}
	},
})
