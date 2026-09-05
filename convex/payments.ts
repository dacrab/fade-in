import { ConvexError, v } from "convex/values"
import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { action } from "./_generated/server"

const POLAR_BASE = "https://api.polar.sh/v1"

function polarToken(): string {
	const token = process.env.POLAR_ACCESS_TOKEN
	if (!token) throw new ConvexError("POLAR_ACCESS_TOKEN not set")
	return token
}

async function polarPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
	const res = await fetch(`${POLAR_BASE}${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${polarToken()}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	})
	const data: unknown = await res.json()
	if (!res.ok) {
		const error = data as { detail?: { msg?: string }[]; error?: string }
		const msg = error.detail?.[0]?.msg || error.error || "Polar API error"
		throw new ConvexError(msg)
	}
	return data as T
}

export const createCheckoutSession = action({
	args: {
		barbershopId: v.id("barbershops"),
		barberId: v.id("barbers"),
		serviceIds: v.array(v.id("services")),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<{ url: string; appointmentId: Id<"appointments"> }> => {
		const user = await ctx.runMutation(api.users.ensureCurrentUser, {})
		if (!user) throw new ConvexError("Not authenticated")

		const { appointmentId, totalPrice } = await ctx.runMutation(api.appointments.create, {
			barbershopId: args.barbershopId,
			barberId: args.barberId,
			serviceIds: args.serviceIds,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
			notes: args.notes,
		})

		let checkout: { id: string; url: string }
		try {
			checkout = await polarPost<{
				id: string
				url: string
			}>("/checkouts/", {
				amount: totalPrice,
				currency: "eur",
				customer_email: user.email,
				metadata: { appointmentId },
				success_url: `${process.env.CONVEX_SITE_URL}/booking/${appointmentId}?payment=success`,
				cancel_url: `${process.env.CONVEX_SITE_URL}/booking/${appointmentId}?payment=canceled`,
			})

			await ctx.runMutation(api.appointments.setPolarCheckout, {
				id: appointmentId,
				polarCheckoutId: checkout.id,
			})
		} catch (err) {
			// The slot was reserved but payment never started (or checkout was not
			// persisted). Free the slot so it isn't permanently orphaned.
			await ctx.runMutation(internal.appointments.removeUnpaidOrphan, { id: appointmentId })
			throw err
		}

		return { url: checkout.url, appointmentId }
	},
})
