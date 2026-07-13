import { ConvexError } from "convex/values"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

/** Resolves the current Clerk-authenticated user from the Convex `users` table. */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
	const identity = await ctx.auth.getUserIdentity()
	if (!identity) return null
	return ctx.db
		.query("users")
		.withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
		.unique()
}

/** Requires an authenticated user, throwing otherwise. */
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
	const user = await getCurrentUser(ctx)
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
