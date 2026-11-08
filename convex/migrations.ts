import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"
import { computeShopStats, currentMonthKey } from "./lib/shopStats"

/**
 * One-time (idempotent) backfill for `shopStats`. Processes a page of shops per
 * invocation and schedules the next page, so the work stays inside Convex's
 * transaction limits. Run with:
 *
 *   bunx convex run migrations:backfillShopStats '{"paginationOpts":{"cursor":null,"numItems":10}}'
 */
export const backfillShopStats = internalMutation({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		const page = await ctx.db.query("barbershops").paginate(args.paginationOpts)

		for (const shop of page.page) {
			const counters = await computeShopStats(ctx, shop._id)
			const existing = ctx.db
				.query("shopStats")
				.withIndex("by_shop", (q) => q.eq("barbershopId", shop._id))
			const rows = await existing.collect()
			const [row, ...duplicates] = rows

			const fields = {
				...counters,
				monthKey: currentMonthKey(),
				backfilledAt: Date.now(),
			}
			if (row) await ctx.db.patch(row._id, fields)
			else await ctx.db.insert("shopStats", { barbershopId: shop._id, ...fields })
			// A shop with no counter row can only get duplicates from two
			// concurrent pre-backfill mutations; collapse them here.
			for (const duplicate of duplicates) await ctx.db.delete(duplicate._id)
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, internal.migrations.backfillShopStats, {
				paginationOpts: { cursor: page.continueCursor, numItems: args.paginationOpts.numItems },
			})
		}

		return { processed: page.page.length, isDone: page.isDone }
	},
})

/** Convenience wrapper for a single shop (used after manual data fixes). */
export const backfillOneShop = internalMutation({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		const shop = await ctx.db.get(args.barbershopId)
		if (!shop) return null

		const counters = await computeShopStats(ctx, args.barbershopId)
		const rows = await ctx.db
			.query("shopStats")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.collect()
		const [row, ...duplicates] = rows
		const fields = { ...counters, monthKey: currentMonthKey(), backfilledAt: Date.now() }

		if (row) await ctx.db.patch(row._id, fields)
		else await ctx.db.insert("shopStats", { barbershopId: args.barbershopId, ...fields })
		for (const duplicate of duplicates) await ctx.db.delete(duplicate._id)

		return fields
	},
})
