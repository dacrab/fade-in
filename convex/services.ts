import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listByShop = query({
  args: { barbershopId: v.id('barbershops') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('services')
      .withIndex('by_shop', (q) => q.eq('barbershopId', args.barbershopId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect()
  },
})

export const getById = query({
  args: { id: v.id('services') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    barbershopId: v.id('barbershops'),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    durationMinutes: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('services', {
      ...args,
      isActive: true,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('services'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    category: v.optional(v.string()),
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

export const remove = mutation({
  args: { id: v.id('services') },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { isActive: false })
  },
})
