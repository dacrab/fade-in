import { getAuthUserId } from "@convex-dev/auth/server"
import type { Doc } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
	const userId = await getAuthUserId(ctx)
	if (!userId) throw new Error("Unauthorized")
	const user = await ctx.db.get(userId)
	if (!user) throw new Error("Unauthorized")
	return user
}
