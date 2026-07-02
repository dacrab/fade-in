import { getAuthUserId } from "@convex-dev/auth/server"
import type { Doc } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
	const userId = await getAuthUserId(ctx)
	if (!userId) return null
	return ctx.db.get(userId)
}

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
	const user = await getCurrentUser(ctx)
	if (!user) throw new Error("Unauthorized")
	return user
}
