import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listByShop = query({
  args: { barbershopId: v.id('barbershops') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('reviews')
      .withIndex('by_shop', (q) => q.eq('barbershopId', args.barbershopId))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    customerId: v.id('users'),
    barbershopId: v.id('barbershops'),
    appointmentId: v.id('appointments'),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const reviewId = await ctx.db.insert('reviews', {
      ...args,
      createdAt: Date.now(),
    })

    // Update shop rating
    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_shop', (q) => q.eq('barbershopId', args.barbershopId))
      .collect()

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, args.rating)
    const newCount = reviews.length + 1
    const avgRating = Math.round((totalRating / newCount) * 10) / 10

    await ctx.db.patch(args.barbershopId, {
      rating: avgRating,
      reviewCount: newCount,
    })

    return reviewId
  },
})

export const addOwnerReply = mutation({
  args: {
    id: v.id('reviews'),
    ownerReply: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { ownerReply: args.ownerReply })
  },
})
