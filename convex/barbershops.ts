import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {
    city: v.optional(v.string()),
    search: v.optional(v.string()),
    minRating: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let shops = await ctx.db
      .query('barbershops')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect()

    if (args.city) {
      const city = args.city.toLowerCase()
      shops = shops.filter((s) => s.city.toLowerCase().includes(city))
    }
    if (args.search) {
      const term = args.search.toLowerCase()
      shops = shops.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.city.toLowerCase().includes(term) ||
          s.address.toLowerCase().includes(term),
      )
    }
    if (args.minRating !== undefined) {
      shops = shops.filter((s) => s.rating >= args.minRating!)
    }
    if (args.isVerified !== undefined) {
      shops = shops.filter((s) => s.isVerified === args.isVerified)
    }

    return shops
  },
})

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6
    const shops = await ctx.db
      .query('barbershops')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect()

    return shops
      .filter((s) => s.isVerified)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('barbershops')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
  },
})

export const getById = query({
  args: { id: v.id('barbershops') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const listByOwner = query({
  args: { ownerId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('barbershops')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    ownerId: v.id('users'),
    description: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    workingHours: v.optional(v.any()),
    socialLinks: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('barbershops', {
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

export const update = mutation({
  args: {
    id: v.id('barbershops'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    workingHours: v.optional(v.any()),
    socialLinks: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args
    const updates: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) updates[k] = val
    }
    return await ctx.db.patch(id, updates)
  },
})

export const verify = mutation({
  args: { id: v.id('barbershops'), isVerified: v.boolean() },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { isVerified: args.isVerified })
  },
})

export const suspend = mutation({
  args: { id: v.id('barbershops'), isActive: v.boolean() },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { isActive: args.isActive })
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('barbershops').collect()
  },
})
