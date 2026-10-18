import { ConvexError, v } from "convex/values"
import { type MutationCtx, mutation, query } from "./_generated/server"
import { requireOwner, requireUser } from "./lib/auth"
import { definedPatch, workingHoursValidator } from "./validators"

async function findUserByEmail(ctx: MutationCtx, email: string) {
	return ctx.db
		.query("users")
		.withIndex("by_email", (q) => q.eq("email", email.trim().toLowerCase()))
		.first()
}

export const getById = query({
	args: { id: v.id("barbers") },
	handler: async (ctx, args) => {
		await requireUser(ctx)
		return ctx.db.get(args.id)
	},
})

export const listByShop = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		return ctx.db
			.query("barbers")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect()
	},
})

export const getByUserId = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return ctx.db
			.query("barbers")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.filter((q) => q.eq(q.field("isActive"), true))
			.first()
	},
})

export const create = mutation({
	args: {
		barbershopId: v.id("barbershops"),
		name: v.string(),
		bio: v.optional(v.string()),
		specializations: v.optional(v.array(v.string())),
		avatarUrl: v.optional(v.string()),
		accountEmail: v.optional(v.string()),
		workingHours: workingHoursValidator,
	},
	handler: async (ctx, args) => {
		await requireOwner(ctx, args.barbershopId)

		const { specializations, accountEmail, ...rest } = args
		const email = accountEmail?.trim()
		const user = email ? await findUserByEmail(ctx, email) : undefined
		if (email && !user) throw new ConvexError("No account found with that email")
		if (user?.role === "customer") await ctx.db.patch(user._id, { role: "barber" })

		return ctx.db.insert("barbers", {
			...rest,
			specializations: specializations ?? [],
			userId: user?._id,
			isActive: true,
		})
	},
})

export const update = mutation({
	args: {
		id: v.id("barbers"),
		name: v.optional(v.string()),
		bio: v.optional(v.string()),
		specializations: v.optional(v.array(v.string())),
		avatarUrl: v.optional(v.string()),
		accountEmail: v.optional(v.string()),
		workingHours: workingHoursValidator,
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const barber = await ctx.db.get(args.id)
		if (!barber) throw new ConvexError("Not found")

		await requireOwner(ctx, barber.barbershopId)

		const { id, accountEmail, ...fields } = args
		const email = accountEmail?.trim()
		const user = email ? await findUserByEmail(ctx, email) : undefined
		if (email && !user) throw new ConvexError("No account found with that email")
		if (user?.role === "customer") await ctx.db.patch(user._id, { role: "barber" })

		return ctx.db.patch(id, definedPatch({ ...fields, userId: user?._id }))
	},
})

export const remove = mutation({
	args: { id: v.id("barbers") },
	handler: async (ctx, args) => {
		const barber = await ctx.db.get(args.id)
		if (!barber) throw new ConvexError("Not found")

		await requireOwner(ctx, barber.barbershopId)

		return ctx.db.patch(args.id, { isActive: false })
	},
})
