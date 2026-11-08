import { query } from "./_generated/server"
import { requireAdmin } from "./lib/auth"

/**
 * Lightweight admin dashboard data: counts and the five newest shops. The
 * previous version loaded up to 500 full shop and user documents to count them
 * client-side, which both truncated the totals and transferred far more data
 * than the page renders.
 */
export const overview = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx)

		const roleCounts = { customer: 0, owner: 0, barber: 0, admin: 0 }
		for await (const user of ctx.db.query("users")) {
			const role = user.role ?? "customer"
			roleCounts[role]++
		}

		let totalShops = 0
		let verifiedShops = 0
		for await (const shop of ctx.db.query("barbershops")) {
			totalShops++
			if (shop.isVerified) verifiedShops++
		}

		const recentShops = await ctx.db.query("barbershops").order("desc").take(5)
		const totalUsers = Object.values(roleCounts).reduce((sum, count) => sum + count, 0)

		return { totalShops, verifiedShops, totalUsers, roleCounts, recentShops }
	},
})
