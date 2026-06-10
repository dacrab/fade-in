import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import Stripe from "stripe"
import type { Doc } from "./_generated/dataModel"
import { action } from "./_generated/server"

function getStripe() {
	const key = process.env.STRIPE_SECRET_KEY
	if (!key) throw new ConvexError("STRIPE_SECRET_KEY not set")
	return new Stripe(key)
}

// biome-ignore lint/suspicious/noExplicitAny: self-referencing api circular type
const runQ = (ctx: any, name: string, args: any) => ctx.runQuery(name, args)
// biome-ignore lint/suspicious/noExplicitAny: self-referencing api circular type
const runM = (ctx: any, name: string, args: any) => ctx.runMutation(name, args)

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

		const stripe = getStripe()

		const services = await Promise.all(
			args.serviceIds.map((id) => runQ(ctx, "services:getById", { id })),
		)
		const totalPrice = (services as (Doc<"services"> | null)[]).reduce((sum, s) => {
			if (!s?.isActive) throw new ConvexError("Invalid service")
			if (s.barbershopId !== args.barbershopId) throw new ConvexError("Service not from this shop")
			return sum + s.price
		}, 0)

		const appointmentId = await runM(ctx, "appointments:create", {
			barbershopId: args.barbershopId,
			barberId: args.barberId,
			serviceIds: args.serviceIds,
			date: args.date,
			startTime: args.startTime,
			endTime: args.endTime,
			notes: args.notes,
		})

		const [shop, barber] = await Promise.all([
			runQ(ctx, "barbershops:getById", { id: args.barbershopId }),
			runQ(ctx, "barbers:getById", { id: args.barberId }),
		])

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "eur",
						product_data: {
							name: `${(services as (Doc<"services"> | null)[]).map((s) => s?.name).join(" + ")} — ${(shop as Doc<"barbershops"> | null)?.name ?? "Barbershop"}`,
							description: `${(barber as Doc<"barbers"> | null)?.name ?? "\u2014"} \u00b7 ${args.date} ${args.startTime}`,
						},
						unit_amount: totalPrice,
					},
					quantity: 1,
				},
			],
			customer_email: (await runQ(ctx, "users:getById", { id: userId }))?.email,
			metadata: { appointmentId },
			success_url: `${process.env.VITE_CONVEX_SITE_URL}/booking/${appointmentId}?payment=success`,
			cancel_url: `${process.env.VITE_CONVEX_SITE_URL}/booking/${appointmentId}?payment=canceled`,
		})

		await runM(ctx, "appointments:setStripeSession", {
			id: appointmentId,
			stripeSessionId: session.id,
		})

		return { url: session.url, appointmentId }
	},
})
