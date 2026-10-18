import { ConvexError, v } from "convex/values"
import { z } from "zod"
import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { action } from "./_generated/server"

const POLAR_BASE = "https://api.polar.sh/v1"

function polarToken(): string {
	const token = process.env.POLAR_ACCESS_TOKEN
	if (!token) throw new ConvexError("POLAR_ACCESS_TOKEN not set")
	return token
}

/**
 * Public app URL used for payment redirects. This is the Vercel deployment, not
 * `CONVEX_SITE_URL` — Convex reserves that name for its own HTTP-actions domain
 * (`https://<deployment>.convex.site`), so using it here would send customers
 * away from the app after checkout.
 */
function publicSiteUrl(): string {
	const url = process.env.PUBLIC_SITE_URL
	if (!url) throw new ConvexError("PUBLIC_SITE_URL not set")
	return url
}

/**
 * POST to the Polar API and validate the response body against `schema`.
 * Polar's API is an external contract: parse instead of casting so a payload
 * change fails loudly here instead of mistyping downstream (e.g. `url` reading
 * as `string` while being `undefined`).
 */
async function polarPost<S extends z.ZodType>(
	path: string,
	body: Record<string, unknown>,
	schema: S,
): Promise<z.infer<S>> {
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
	return schema.parse(data)
}

const polarCheckoutSchema = z.object({ id: z.string().min(1), url: z.string().url() })

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

		const { appointmentId, totalPrice } = await ctx.runMutation(api.appointments.create, {
			barbershopId: args.barbershopId,
			barberId: args.barberId,
			serviceIds: args.serviceIds,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
			notes: args.notes,
		})

		let checkout: z.infer<typeof polarCheckoutSchema>
		try {
			const siteUrl = publicSiteUrl()
			checkout = await polarPost(
				"/checkouts/",
				{
					amount: totalPrice,
					currency: "eur",
					customer_email: user.email,
					metadata: { appointmentId },
					success_url: `${siteUrl}/booking/${appointmentId}?payment=success`,
					cancel_url: `${siteUrl}/booking/${appointmentId}?payment=canceled`,
				},
				polarCheckoutSchema,
			)

			await ctx.runMutation(internal.appointments.setPolarCheckout, {
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
