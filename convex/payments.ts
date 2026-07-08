import { getAuthUserId } from "@convex-dev/auth/server"
import type {
	DefaultFunctionArgs,
	FunctionReference,
	RegisteredMutation,
	RegisteredQuery,
} from "convex/server"
import { ConvexError, v } from "convex/values"
import type { ActionCtx } from "./_generated/server"
import { action } from "./_generated/server"
import { create as createAppointment, setPolarCheckout } from "./appointments"
import { getById as getServiceById } from "./services"
import { getById as getUserById } from "./users"

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

type QueryArgs<F> = F extends RegisteredQuery<"public", infer A, unknown> ? A : never
type MutationArgs<F> = F extends RegisteredMutation<"public", infer A, unknown> ? A : never

const runQ = <F extends RegisteredQuery<"public", DefaultFunctionArgs, unknown>>(
	ctx: ActionCtx,
	name: F,
	args: QueryArgs<F>,
) => ctx.runQuery(name as unknown as FunctionReference<"query", "public">, args)
const runM = <F extends RegisteredMutation<"public", DefaultFunctionArgs, unknown>>(
	ctx: ActionCtx,
	name: F,
	args: MutationArgs<F>,
) => ctx.runMutation(name as unknown as FunctionReference<"mutation", "public">, args)

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
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) throw new ConvexError("Not authenticated")

		const services = await Promise.all(args.serviceIds.map((id) => runQ(ctx, getServiceById, { id })))
		const totalPrice = services.reduce((sum, s) => {
			if (!s?.isActive) throw new ConvexError("Invalid service")
			if (s.barbershopId !== args.barbershopId) throw new ConvexError("Service not from this shop")
			return sum + s.price
		}, 0)

		const appointmentId = await runM(ctx, createAppointment, {
			barbershopId: args.barbershopId,
			barberId: args.barberId,
			serviceIds: args.serviceIds,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
			notes: args.notes,
		})

		const user = await runQ(ctx, getUserById, { id: userId })

		const checkout = await polarPost<{ id: string; url: string }>("/checkouts/", {
			amount: totalPrice,
			currency: "eur",
			customer_email: user?.email,
			metadata: { appointmentId },
			success_url: `${process.env.VITE_CONVEX_SITE_URL}/booking/${appointmentId}?payment=success`,
			cancel_url: `${process.env.VITE_CONVEX_SITE_URL}/booking/${appointmentId}?payment=canceled`,
		})

		await runM(ctx, setPolarCheckout, {
			id: appointmentId,
			polarCheckoutId: checkout.id,
		})

		return { url: checkout.url, appointmentId }
	},
})
