import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError } from "convex/values"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
	const userId = await getAuthUserId(ctx)
	if (!userId) throw new ConvexError("Not authenticated")
	const user = await ctx.db.get(userId)
	if (!user) throw new ConvexError("Not authenticated")
	return user
}

/** Ensures the caller is authenticated and owns the given barbershop. */
export async function requireOwner(
	ctx: MutationCtx | QueryCtx,
	barbershopId: Id<"barbershops">,
): Promise<Doc<"users">> {
	const user = await requireUser(ctx)
	const shop = await ctx.db.get(barbershopId)
	if (!shop || shop.ownerId !== user._id) throw new ConvexError("Not authorized")
	return user
}
