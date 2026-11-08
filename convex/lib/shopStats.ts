import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

type AppointmentStatus = Doc<"appointments">["status"]
type StatsRow = Doc<"shopStats">

const ZERO_COUNTERS = {
	totalRevenue: 0,
	monthRevenue: 0,
	completedCount: 0,
	totalCount: 0,
	pendingCount: 0,
	cancelledCount: 0,
} as const

/** Appointment dates are local-time `YYYY-MM-DD`, so the month is its prefix. */
export function monthKeyOf(date: string): string {
	return date.slice(0, 7)
}

export function currentMonthKey(now = new Date()): string {
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function isOpenStatus(status: AppointmentStatus): boolean {
	return status === "pending" || status === "confirmed"
}

/** Net change in each counter for one status transition. */
function countDelta(from?: AppointmentStatus, to?: AppointmentStatus) {
	return {
		total: (to !== undefined ? 1 : 0) - (from !== undefined ? 1 : 0),
		completed: (to === "completed" ? 1 : 0) - (from === "completed" ? 1 : 0),
		pending:
			(to !== undefined && isOpenStatus(to) ? 1 : 0) -
			(from !== undefined && isOpenStatus(from) ? 1 : 0),
		cancelled: (to === "cancelled" ? 1 : 0) - (from === "cancelled" ? 1 : 0),
	}
}

function revenueDelta(
	from: AppointmentStatus | undefined,
	to: AppointmentStatus | undefined,
	price: number,
	inCurrentMonth: boolean,
) {
	const before = from === "completed" ? price : 0
	const after = to === "completed" ? price : 0
	return {
		total: after - before,
		// Completed revenue only counts toward the current month when the
		// appointment itself is dated in that month.
		month: inCurrentMonth ? after - before : 0,
	}
}

export async function getStatsRow(
	ctx: QueryCtx | MutationCtx,
	barbershopId: Id<"barbershops">,
): Promise<StatsRow | null> {
	return ctx.db
		.query("shopStats")
		.withIndex("by_shop", (q) => q.eq("barbershopId", barbershopId))
		.first()
}

/** Revenue from completed appointments dated in `month`, using the index. */
export async function computeMonthRevenue(
	ctx: QueryCtx | MutationCtx,
	barbershopId: Id<"barbershops">,
	month: string,
): Promise<number> {
	const [year, monthNumber] = month.split("-").map(Number)
	const next = new Date(year ?? 0, monthNumber ?? 1, 1)
	const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`

	const completed = await ctx.db
		.query("appointments")
		.withIndex("by_shop_status_date", (q) =>
			q
				.eq("barbershopId", barbershopId)
				.eq("status", "completed")
				.gte("date", `${month}-01`)
				.lt("date", `${nextMonth}-01`),
		)
		.collect()

	return completed.reduce((sum, appointment) => sum + appointment.totalPrice, 0)
}

/** Legacy path for shops whose counter row predates the backfill. */
export async function computeShopStats(
	ctx: QueryCtx | MutationCtx,
	barbershopId: Id<"barbershops">,
) {
	const allAppointments = await ctx.db
		.query("appointments")
		.withIndex("by_shop", (q) => q.eq("barbershopId", barbershopId))
		.collect()

	const completed = allAppointments.filter((appointment) => appointment.status === "completed")
	const thisMonth = currentMonthKey()

	return {
		totalRevenue: completed.reduce((sum, appointment) => sum + appointment.totalPrice, 0),
		monthRevenue: completed
			.filter((appointment) => appointment.date.startsWith(thisMonth))
			.reduce((sum, appointment) => sum + appointment.totalPrice, 0),
		completedCount: completed.length,
		totalCount: allAppointments.length,
		pendingCount: allAppointments.filter((appointment) => isOpenStatus(appointment.status)).length,
		cancelledCount: allAppointments.filter((appointment) => appointment.status === "cancelled")
			.length,
	}
}

export interface AppointmentStatsChange {
	barbershopId: Id<"barbershops">
	date: string
	totalPrice: number
	/** Status before the change; omit when the appointment is being created. */
	from?: AppointmentStatus
	/** Status after the change; omit when the appointment is being deleted. */
	to?: AppointmentStatus
}

/**
 * Apply one appointment transition to the shop's counters. Runs inside the same
 * mutation as the appointment write, so a retried mutation applies its delta
 * exactly once. The month bucket rolls over lazily: the first write in a new
 * month resets it before the delta is applied.
 */
export async function applyAppointmentStatsChange(
	ctx: MutationCtx,
	change: AppointmentStatsChange,
): Promise<void> {
	const { from, to } = change
	if (from === undefined && to === undefined) return

	const row = await getStatsRow(ctx, change.barbershopId)
	const nowMonth = currentMonthKey()
	const base = row ?? { _id: null, ...ZERO_COUNTERS, monthKey: nowMonth }

	// A stale month bucket no longer describes the current month. Recompute the
	// month exactly from the index before applying this delta: zeroing it would
	// drop revenue accrued since the last mutation in the previous month.
	const baseMonthRevenue =
		base.monthKey === nowMonth
			? base.monthRevenue
			: await computeMonthRevenue(ctx, change.barbershopId, nowMonth)
	const inCurrentMonth = monthKeyOf(change.date) === nowMonth
	const counts = countDelta(from, to)
	const revenue = revenueDelta(from, to, change.totalPrice, inCurrentMonth)

	const fields = {
		totalRevenue: base.totalRevenue + revenue.total,
		monthRevenue: baseMonthRevenue + revenue.month,
		completedCount: base.completedCount + counts.completed,
		totalCount: base.totalCount + counts.total,
		pendingCount: base.pendingCount + counts.pending,
		cancelledCount: base.cancelledCount + counts.cancelled,
		monthKey: nowMonth,
	}

	if (row) {
		await ctx.db.patch(row._id, fields)
		return
	}

	// No row yet (shop predates the aggregate): create one without
	// `backfilledAt`, which keeps `getShopStats` on the exact legacy path until
	// the backfill runs.
	await ctx.db.insert("shopStats", { barbershopId: change.barbershopId, ...fields })
}
