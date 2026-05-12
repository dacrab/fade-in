import { getAuthUserId } from "@convex-dev/auth/server"
import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const listByShop = query({
	args: {
		barbershopId: v.id("barbershops"),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		return ctx.db
			.query("reviews")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.order("desc")
			.paginate(args.paginationOpts)
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
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const reviewId = await ctx.db.insert("reviews", {
			...args,
			createdAt: Date.now(),
		})

		const shop = await ctx.db.get(args.barbershopId)
		if (shop) {
			const newCount = shop.reviewCount + 1
			const newRating =
				Math.round(((shop.rating * shop.reviewCount + args.rating) / newCount) * 10) / 10
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
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const review = await ctx.db.get(args.id)
		if (!review) throw new ConvexError("Not found")

		const shop = await ctx.db.get(review.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, { ownerReply: args.ownerReply })
	},
})
