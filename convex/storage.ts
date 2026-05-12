import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"
import { mutation } from "./_generated/server"

/** Generates a short-lived upload URL for Convex file storage. */
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		return await ctx.storage.generateUploadUrl()
	},
})
