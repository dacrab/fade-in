import { ConvexError, v } from "convex/values"
import { api } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import { action } from "./_generated/server"
import { computeServiceTotal } from "./lib/services"

const POLAR_BASE = "https://api.polar.sh/v1"

function polarToken(): string {
	const token = process.env.POLAR_ACCESS_TOKEN
	if (!token) throw new ConvexError("POLAR_ACCESS_TOKEN not set")
	return token
}

async function polarPost<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
	const res = await fetch(`${POLAR_BASE}${path}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${polarToken()}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	})
	const data = await res.json()
	if (!res.ok) {
		const msg = data.detail?.[0]?.msg || data.error || "Polar API error"
		throw new ConvexError(msg)
	}
	return data as T
}

// biome-ignore lint/suspicious/noExplicitAny: Convex action ctx cannot be typed with string-based runQuery/runMutation
const runQ = (ctx: any, name: string, args: unknown) => ctx.runQuery(name, args)
// biome-ignore lint/suspicious/noExplicitAny: Convex action ctx cannot be typed with string-based runQuery/runMutation
const runM = (ctx: any, name: string, args: unknown) => ctx.runMutation(name, args)

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
		const user = (await ctx.runMutation(api.users.ensureCurrentUser, {})) as Doc<"users">

		const totalPrice = await computeServiceTotal(
			(id: Id<"services">) => runQ(ctx, "services:getById", { id }) as Promise<Doc<"services"> | null>,
			args.serviceIds,
			args.barbershopId,
		)

		const appointmentId: Id<"appointments"> = await runM(ctx, "appointments:create", {
			barbershopId: args.barbershopId,
			barberId: args.barberId,
			serviceIds: args.serviceIds,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
			notes: args.notes,
		})

		const checkout: { id: string; url: string } = await polarPost<{
			id: string
			url: string
		}>("/checkouts/", {
			amount: totalPrice,
			currency: "eur",
			customer_email: user.email,
			metadata: { appointmentId },
			success_url: `${process.env.VITE_CONVEX_SITE_URL}/booking/${appointmentId}?payment=success`,
			cancel_url: `${process.env.VITE_CONVEX_SITE_URL}/booking/${appointmentId}?payment=canceled`,
		})

		await runM(ctx, "appointments:setPolarCheckout", {
			id: appointmentId,
			polarCheckoutId: checkout.id,
		})

		return { url: checkout.url, appointmentId }
	},
})
