import { ConvexError, v } from "convex/values"
import { mutation } from "./_generated/server"
import { requireOwner, requireUser } from "./lib/auth"

export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		await requireUser(ctx)
		return ctx.storage.generateUploadUrl()
	},
})

export const saveShopImage = mutation({
	args: {
		barbershopId: v.id("barbershops"),
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		await requireOwner(ctx, args.barbershopId)

		const shop = await ctx.db.get(args.barbershopId)
		if (!shop) throw new ConvexError("Barbershop not found")

		const url = await ctx.storage.getUrl(args.storageId)
		if (!url) throw new ConvexError("Failed to get uploaded file URL")

		await ctx.db.patch(args.barbershopId, {
			images: [...shop.images, url],
		})

		return url
	},
})

export const removeShopImage = mutation({
	args: {
		barbershopId: v.id("barbershops"),
		imageUrl: v.string(),
	},
	handler: async (ctx, args) => {
		await requireOwner(ctx, args.barbershopId)

		const shop = await ctx.db.get(args.barbershopId)
		if (!shop) throw new ConvexError("Barbershop not found")

		await ctx.db.patch(args.barbershopId, {
			images: shop.images.filter((url) => url !== args.imageUrl),
		})
	},
})

export const saveBarberAvatar = mutation({
	args: {
		barberId: v.id("barbers"),
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		const barber = await ctx.db.get(args.barberId)
		if (!barber) throw new ConvexError("Barber not found")

		await requireOwner(ctx, barber.barbershopId)

		const url = await ctx.storage.getUrl(args.storageId)
		if (!url) throw new ConvexError("Failed to get uploaded file URL")

		await ctx.db.patch(args.barberId, { avatarUrl: url })
		return url
	},
})
