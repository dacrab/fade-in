import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const listByShop = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("reviews")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.order("desc")
			.collect()
	},
})

export const create = mutation({
	args: {
		customerId: v.id("users"),
		barbershopId: v.id("barbershops"),
		appointmentId: v.id("appointments"),
		rating: v.number(),
		comment: v.string(),
	},
	handler: async (ctx, args) => {
		const reviewId = await ctx.db.insert("reviews", {
			...args,
			createdAt: Date.now(),
		})

		// Incrementally update the shop's rating using the existing denormalized
		// rating and reviewCount — no need to re-fetch all reviews.
		const shop = await ctx.db.get(args.barbershopId)
		if (shop) {
			const newCount = shop.reviewCount + 1
			const newRating = Math.round(((shop.rating * shop.reviewCount + args.rating) / newCount) * 10) / 10
			await ctx.db.patch(args.barbershopId, { rating: newRating, reviewCount: newCount })
		}

		return reviewId
	},
})

export const addOwnerReply = mutation({
	args: {
		id: v.id("reviews"),
		ownerReply: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, { ownerReply: args.ownerReply })
	},
})
