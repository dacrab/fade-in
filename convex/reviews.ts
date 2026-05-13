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
		barbershopId: v.id("barbershops"),
		appointmentId: v.id("appointments"),
		rating: v.number(),
		comment: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating))
			throw new ConvexError("Rating must be an integer between 1 and 5")

		if (args.comment.trim().length === 0) throw new ConvexError("Comment cannot be empty")

		// Verify the appointment belongs to this user and shop
		const appt = await ctx.db.get(args.appointmentId)
		if (!appt || appt.customerId !== userId || appt.barbershopId !== args.barbershopId)
			throw new ConvexError("Invalid appointment")
		if (appt.status !== "completed") throw new ConvexError("Can only review completed appointments")

		const reviewId = await ctx.db.insert("reviews", {
			customerId: userId,
			barbershopId: args.barbershopId,
			appointmentId: args.appointmentId,
			rating: args.rating,
			comment: args.comment.trim(),
			createdAt: Date.now(),
		})

		// Update shop rating
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

		if (args.ownerReply.trim().length === 0) throw new ConvexError("Reply cannot be empty")

		const review = await ctx.db.get(args.id)
		if (!review) throw new ConvexError("Not found")

		const shop = await ctx.db.get(review.barbershopId)
		if (!shop || shop.ownerId !== userId) throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, { ownerReply: args.ownerReply.trim() })
	},
})
