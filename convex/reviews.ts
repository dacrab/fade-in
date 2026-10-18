import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireOwner, requireUser } from "./lib/auth"

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
		appointmentId: v.id("appointments"),
		rating: v.number(),
		comment: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const userId = user._id

		const appt = await ctx.db.get(args.appointmentId)
		if (!appt) throw new ConvexError("Appointment not found")
		if (appt.customerId !== userId) throw new ConvexError("Not your appointment")
		if (appt.status !== "completed") throw new ConvexError("Can only review completed appointments")
		if (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 5)
			throw new ConvexError("Rating must be an integer from 1 to 5")
		if (args.comment.trim().length === 0) throw new ConvexError("Comment cannot be empty")

		const existing = await ctx.db
			.query("reviews")
			.withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
			.unique()
		if (existing) throw new ConvexError("Already reviewed this appointment")

		const shop = await ctx.db.get(appt.barbershopId)
		if (!shop) throw new ConvexError("Shop not found")

		const reviewId = await ctx.db.insert("reviews", {
			customerId: userId,
			barbershopId: appt.barbershopId,
			appointmentId: args.appointmentId,
			rating: args.rating,
			comment: args.comment.trim(),
			createdAt: Date.now(),
		})

		// Incremental average: the shop stores the exact (unrounded) mean and
		// clients round to one decimal for display.
		const prevCount = shop.reviewCount
		const nextCount = prevCount + 1
		const nextRating = (shop.rating * prevCount + args.rating) / nextCount

		await ctx.db.patch(appt.barbershopId, {
			rating: nextRating,
			reviewCount: nextCount,
		})

		return reviewId
	},
})

export const hasReview = query({
	args: { appointmentId: v.id("appointments") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx)
		const appt = await ctx.db.get(args.appointmentId)
		// Fail closed: a missing or foreign appointment reports "already reviewed"
		// so the UI never offers to review someone else's booking.
		if (!appt || appt.customerId !== user._id) return true

		const existing = await ctx.db
			.query("reviews")
			.withIndex("by_appointment", (q) => q.eq("appointmentId", args.appointmentId))
			.unique()
		return existing !== null
	},
})

export const addOwnerReply = mutation({
	args: {
		id: v.id("reviews"),
		ownerReply: v.string(),
	},
	handler: async (ctx, args) => {
		if (args.ownerReply.trim().length === 0) throw new ConvexError("Reply cannot be empty")

		const review = await ctx.db.get(args.id)
		if (!review) throw new ConvexError("Not found")

		await requireOwner(ctx, review.barbershopId)

		return ctx.db.patch(args.id, { ownerReply: args.ownerReply.trim() })
	},
})
