import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireOwner } from "./lib/auth"
import { definedPatch, MAX_DURATION_MINUTES } from "./validators"

function assertValidPrice(price: number) {
	if (!(price > 0)) throw new ConvexError("Price must be greater than zero")
}

function assertValidDuration(durationMinutes: number) {
	if (durationMinutes < 1 || durationMinutes > MAX_DURATION_MINUTES)
		throw new ConvexError("Invalid duration")
}

export const listByShop = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		return ctx.db
			.query("services")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect()
	},
})

export const create = mutation({
	args: {
		barbershopId: v.id("barbershops"),
		name: v.string(),
		description: v.optional(v.string()),
		price: v.number(),
		durationMinutes: v.number(),
		category: v.string(),
	},
	handler: async (ctx, args) => {
		assertValidPrice(args.price)
		assertValidDuration(args.durationMinutes)

		await requireOwner(ctx, args.barbershopId)

		return ctx.db.insert("services", {
			...args,
			isActive: true,
		})
	},
})

export const update = mutation({
	args: {
		id: v.id("services"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		price: v.optional(v.number()),
		durationMinutes: v.optional(v.number()),
		category: v.optional(v.string()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const service = await ctx.db.get(args.id)
		if (!service) throw new ConvexError("Not found")

		await requireOwner(ctx, service.barbershopId)

		// Validate the merged result so a partial patch can't slip an invalid
		// price or duration past the checks.
		assertValidPrice(args.price ?? service.price)
		assertValidDuration(args.durationMinutes ?? service.durationMinutes)

		const { id, ...fields } = args
		return ctx.db.patch(id, definedPatch(fields))
	},
})

export const remove = mutation({
	args: { id: v.id("services") },
	handler: async (ctx, args) => {
		const service = await ctx.db.get(args.id)
		if (!service) throw new ConvexError("Not found")

		await requireOwner(ctx, service.barbershopId)

		return ctx.db.patch(args.id, { isActive: false })
	},
})
