import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    return await ctx.db.get(userId)
  },
})

export const getMe = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})

export const getById = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal('customer'),
      v.literal('owner'),
      v.literal('barber'),
      v.literal('admin'),
    ),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()
    if (existing) return existing._id

    return await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      role: args.role,
      phone: args.phone,
      avatarUrl: args.avatarUrl,
      favoriteShopIds: [],
    })
  },
})

export const updateProfile = mutation({
  args: {
    id: v.id('users'),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args
    const updates: Record<string, unknown> = {}
    if (fields.name !== undefined) updates.name = fields.name
    if (fields.phone !== undefined) updates.phone = fields.phone
    if (fields.avatarUrl !== undefined) updates.avatarUrl = fields.avatarUrl
    return await ctx.db.patch(id, updates)
  },
})

export const toggleFavorite = mutation({
  args: {
    userId: v.id('users'),
    shopId: v.id('barbershops'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error('User not found')
    const favorites = [...user.favoriteShopIds]
    const idx = favorites.indexOf(args.shopId)
    if (idx === -1) favorites.push(args.shopId)
    else favorites.splice(idx, 1)
    return await ctx.db.patch(args.userId, { favoriteShopIds: favorites })
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})
