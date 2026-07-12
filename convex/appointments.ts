import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { centsToEur } from "../src/lib/money"
import { generateSlots } from "../src/lib/slots"
import { generateManageToken, verifyManageToken } from "../src/lib/token"
import type { Doc, Id } from "./_generated/dataModel"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"
import { confirmationEmailHtml, reminderEmailHtml, sendEmail } from "./lib/email"
import { computeServiceTotal } from "./lib/services"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const MAX_DURATION_MINUTES = 480

/**
 * Returns non-cancelled appointments for a barbershop/date/barber. Shared by
 * slot availability and creation so conflict detection stays consistent.
 */
async function getActiveAppointments(
	ctx: QueryCtx | MutationCtx,
	{
		barbershopId,
		date,
		barberId,
	}: { barbershopId: Id<"barbershops">; date: string; barberId: Id<"barbers"> },
) {
	return ctx.db
		.query("appointments")
		.withIndex("by_shop_date", (q) => q.eq("barbershopId", barbershopId).eq("date", date))
		.filter((q) => q.and(q.eq(q.field("barberId"), barberId), q.neq(q.field("status"), "cancelled")))
		.collect()
}

export const getAvailableSlots = query({
	args: {
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		date: v.string(),
		durationMinutes: v.number(),
	},
	handler: async (ctx, args) => {
		if (!DATE_RE.test(args.date)) throw new ConvexError("Invalid date format")
		if (args.durationMinutes < 1 || args.durationMinutes > MAX_DURATION_MINUTES)
			throw new ConvexError("Invalid duration")

		const existing = await getActiveAppointments(ctx, {
			barbershopId: args.barbershopId,
			date: args.date,
			barberId: args.barberId,
		})

		return generateSlots(args.durationMinutes, existing)
	},
})

export const create = mutation({
	args: {
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		serviceIds: v.array(v.id("services")),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")
		if (!DATE_RE.test(args.date)) throw new ConvexError("Invalid date format")
		if (!(TIME_RE.test(args.startTime) && TIME_RE.test(args.endTime)))
			throw new ConvexError("Invalid time format")
		if (args.serviceIds.length === 0) throw new ConvexError("At least one service required")

		// Compute price server-side from services (also validates each service)
		const totalPrice = await computeServiceTotal(
			(id) => ctx.db.get(id),
			args.serviceIds,
			args.barbershopId,
		)

		// Validate slot is still available
		const existing = await getActiveAppointments(ctx, {
			barbershopId: args.barbershopId,
			date: args.date,
			barberId: args.barberId,
		})

		const conflict = existing.some((a) => args.startTime < a.endTime && args.endTime > a.startTime)
		if (conflict) throw new ConvexError("This time slot is no longer available.")

		const appointmentId = await ctx.db.insert("appointments", {
			customerId: userId,
			barbershopId: args.barbershopId,
			barberId: args.barberId,
			serviceIds: args.serviceIds,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
			totalPrice,
			notes: args.notes,
			status: "pending",
			createdAt: Date.now(),
		})

		// Send booking confirmation email with manage link (best-effort)
		try {
			const [customer, shop, barber] = await Promise.all([
				ctx.db.get(userId),
				ctx.db.get(args.barbershopId),
				ctx.db.get(args.barberId),
			])
			if (customer?.email) {
				const token = await generateManageToken(
					appointmentId,
					customer.email,
					process.env.RESEND_API_KEY ?? "",
				)
				const manageUrl = `${process.env.CONVEX_SITE_URL ?? ""}/booking/${appointmentId}/manage?token=${token}`
				await sendEmail(
					customer.email,
					`Booking Confirmed — ${shop?.name ?? "Barbershop"}`,
					confirmationEmailHtml({
						customerName: customer.name ?? "there",
						shopName: shop?.name ?? "Barbershop",
						barberName: barber?.name ?? "—",
						date: args.date,
						startTime: args.startTime,
						endTime: args.endTime,
						total: centsToEur(totalPrice),
						manageUrl,
					}),
				)
			}
		} catch {
			// Email failure should not block the booking
		}

		return appointmentId
	},
})

export const updateStatus = mutation({
	args: {
		id: v.id("appointments"),
		status: v.union(
			v.literal("pending"),
			v.literal("confirmed"),
			v.literal("completed"),
			v.literal("cancelled"),
		),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Not found")

		// Customer can only cancel their own appointments
		if (appt.customerId === userId) {
			if (args.status !== "cancelled") throw new ConvexError("Customers can only cancel appointments")
			return ctx.db.patch(args.id, { status: args.status })
		}

		// Shop owner can confirm/complete/cancel
		const shop = await ctx.db.get(appt.barbershopId)
		if (!shop) throw new ConvexError("Shop not found")

		const user = await ctx.db.get(userId)
		if (shop.ownerId === userId || user?.role === "admin") {
			return ctx.db.patch(args.id, { status: args.status })
		}

		throw new ConvexError("Not authorized")
	},
})

export const listByCustomer = query({
	args: { customerId: v.id("users") },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId || userId !== args.customerId) return []

		return ctx.db
			.query("appointments")
			.withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
			.order("desc")
			.collect()
	},
})

export const listByShop = query({
	args: {
		barbershopId: v.id("barbershops"),
		date: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const date = args.date
		if (date) {
			return ctx.db
				.query("appointments")
				.withIndex("by_shop_date", (q) => q.eq("barbershopId", args.barbershopId).eq("date", date))
				.order("desc")
				.collect()
		}
		return ctx.db
			.query("appointments")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.order("desc")
			.collect()
	},
})

export const listByBarber = query({
	args: { barberId: v.id("barbers"), date: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const appts = await ctx.db
			.query("appointments")
			.withIndex("by_barber", (q) => q.eq("barberId", args.barberId))
			.order("desc")
			.collect()

		const date = args.date
		return date ? appts.filter((a) => a.date === date) : appts
	},
})

export const confirmFromCheckout = mutation({
	args: {
		polarCheckoutId: v.string(),
	},
	handler: async (ctx, args) => {
		const appt = await ctx.db
			.query("appointments")
			.withIndex("by_polar_checkout", (q) => q.eq("polarCheckoutId", args.polarCheckoutId))
			.unique()
		if (!appt) throw new ConvexError("Appointment not found for session")
		if (appt.status !== "pending") return // already confirmed
		await ctx.db.patch(appt._id, { status: "confirmed", paymentStatus: "paid" })
	},
})

export const setPolarCheckout = mutation({
	args: {
		id: v.id("appointments"),
		polarCheckoutId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			polarCheckoutId: args.polarCheckoutId,
			paymentStatus: "unpaid",
		})
	},
})

/** Server-side stats for business dashboard — avoids loading all appointments client-side */
export const getShopStats = query({
	args: { barbershopId: v.id("barbershops") },
	handler: async (ctx, args) => {
		const allAppts = await ctx.db
			.query("appointments")
			.withIndex("by_shop", (q) => q.eq("barbershopId", args.barbershopId))
			.collect()

		const completed = allAppts.filter((a) => a.status === "completed")
		const now = new Date()
		const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

		return {
			totalRevenue: completed.reduce((sum, a) => sum + a.totalPrice, 0),
			monthRevenue: completed
				.filter((a) => a.date.startsWith(thisMonth))
				.reduce((sum, a) => sum + a.totalPrice, 0),
			completedCount: completed.length,
			totalCount: allAppts.length,
			pendingCount: allAppts.filter((a) => a.status === "pending" || a.status === "confirmed").length,
			cancelledCount: allAppts.filter((a) => a.status === "cancelled").length,
		}
	},
})

export const getById = query({
	args: { id: v.id("appointments") },
	handler: async (ctx, args) => ctx.db.get(args.id),
})

export const reschedule = mutation({
	args: {
		id: v.id("appointments"),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Not found")
		if (appt.customerId !== userId) throw new ConvexError("Not authorized")

		return ctx.db.patch(args.id, {
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
		})
	},
})

export const cancelByToken = mutation({
	args: {
		id: v.id("appointments"),
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Appointment not found")
		if (appt.status === "cancelled") throw new ConvexError("Already cancelled")
		if (appt.status === "completed") throw new ConvexError("Cannot cancel a completed appointment")

		const customer = await ctx.db.get(appt.customerId)
		if (!customer?.email) throw new ConvexError("Customer email not found")

		const valid = await verifyManageToken(
			args.token,
			args.id,
			customer.email,
			process.env.RESEND_API_KEY ?? "",
		)
		if (!valid) throw new ConvexError("Invalid or expired link")

		await ctx.db.patch(args.id, { status: "cancelled" })

		// Notify shop owner
		try {
			const shop = await ctx.db.get(appt.barbershopId)
			const owner = shop?.ownerId ? await ctx.db.get(shop.ownerId) : null
			if (owner?.email) {
				await sendEmail(
					owner.email,
					`Appointment Cancelled — ${customer.name ?? "A customer"}`,
					`<p>The appointment on <strong>${appt.date}</strong> at ${appt.startTime} has been cancelled by the customer via self-service.</p>`,
				)
			}
		} catch {
			// Best-effort
		}

		return { success: true }
	},
})

export const requestRescheduleByToken = mutation({
	args: {
		id: v.id("appointments"),
		token: v.string(),
		message: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Appointment not found")
		if (appt.status === "cancelled") throw new ConvexError("Appointment is cancelled")
		if (appt.status === "completed") throw new ConvexError("Appointment is completed")

		const customer = await ctx.db.get(appt.customerId)
		if (!customer?.email) throw new ConvexError("Customer email not found")

		const valid = await verifyManageToken(
			args.token,
			args.id,
			customer.email,
			process.env.RESEND_API_KEY ?? "",
		)
		if (!valid) throw new ConvexError("Invalid or expired link")

		// Notify the shop owner of the reschedule request
		try {
			const shop = await ctx.db.get(appt.barbershopId)
			const owner = shop?.ownerId ? await ctx.db.get(shop.ownerId) : null
			if (owner?.email) {
				await sendEmail(
					owner.email,
					`Reschedule Request — ${appt.date} at ${appt.startTime}`,
					`<p><strong>${customer.name ?? "A customer"}</strong> has requested to reschedule their appointment.</p>
					<p><strong>Original:</strong> ${appt.date} at ${appt.startTime} – ${appt.endTime}<br>
					${args.message ? `<strong>Message:</strong> ${args.message}` : ""}</p>
					<p>Please contact them to arrange a new time.</p>`,
				)
			}
		} catch {
			// Best-effort
		}

		return { success: true }
	},
})

export const sendReminder = mutation({
	args: {
		id: v.id("appointments"),
	},
	handler: async (ctx, args) => {
		const appt = await ctx.db.get(args.id)
		if (!appt) throw new ConvexError("Appointment not found")
		if (appt.status === "cancelled") throw new ConvexError("Appointment is cancelled")

		const [customer, shop, barber] = await Promise.all([
			ctx.db.get(appt.customerId),
			ctx.db.get(appt.barbershopId),
			ctx.db.get(appt.barberId),
		])

		if (!customer?.email) throw new ConvexError("Customer email not found")

		const token = await generateManageToken(args.id, customer.email, process.env.RESEND_API_KEY ?? "")
		const manageUrl = `${process.env.CONVEX_SITE_URL ?? ""}/booking/${args.id}/manage?token=${token}`

		await sendEmail(
			customer.email,
			`Reminder — Your appointment at ${shop?.name ?? "Barbershop"} is soon!`,
			reminderEmailHtml({
				customerName: customer.name ?? "there",
				shopName: shop?.name ?? "Barbershop",
				barberName: barber?.name ?? "—",
				date: appt.date,
				startTime: appt.startTime,
				endTime: appt.endTime,
				manageUrl,
			}),
		)

		return { success: true }
	},
})

/** Admin: returns all appointments with customer/shop/barber names for the data table. */
export const listAllWithDetails = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []
		const user = await ctx.db.get(userId)
		if (user?.role !== "admin") return []

		const all = await ctx.db.query("appointments").order("desc").collect()
		const customers = new Map<Id<"users">, Doc<"users">>(
			(await Promise.all(all.map((a) => ctx.db.get(a.customerId))))
				.filter((u): u is Doc<"users"> => u != null)
				.map((u) => [u._id, u]),
		)
		const shops = new Map<Id<"barbershops">, Doc<"barbershops">>(
			(await Promise.all(all.map((a) => ctx.db.get(a.barbershopId))))
				.filter((s): s is Doc<"barbershops"> => s != null)
				.map((s) => [s._id, s]),
		)
		const barbers = new Map<Id<"barbers">, Doc<"barbers">>(
			(await Promise.all(all.map((a) => ctx.db.get(a.barberId))))
				.filter((b): b is Doc<"barbers"> => b != null)
				.map((b) => [b._id, b]),
		)

		return all.map((a) => ({
			_id: a._id,
			date: a.date,
			startTime: a.startTime,
			endTime: a.endTime,
			totalPrice: a.totalPrice,
			status: a.status,
			paymentStatus: a.paymentStatus,
			shopName: shops.get(a.barbershopId)?.name ?? "—",
			barberName: barbers.get(a.barberId)?.name ?? "—",
			customerName: customers.get(a.customerId)?.name ?? "—",
		}))
	},
})
