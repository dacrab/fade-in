import { httpRouter } from "convex/server"
import Stripe from "stripe"
import { api } from "./_generated/api"
import { httpAction } from "./_generated/server"
import { auth } from "./auth"

const http = httpRouter()
auth.addHttpRoutes(http)

http.route({
	path: "/stripe-webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const body = await request.text()
		const signature = request.headers.get("stripe-signature")
		if (!signature) return new Response("Missing signature", { status: 400 })

		const key = process.env.STRIPE_SECRET_KEY
		const secret = process.env.STRIPE_WEBHOOK_SECRET
		if (!(key && secret)) return new Response("Missing Stripe config", { status: 500 })

		const stripe = new Stripe(key)

		let event: Stripe.Event
		try {
			event = stripe.webhooks.constructEvent(body, signature, secret)
		} catch {
			return new Response("Invalid signature", { status: 400 })
		}

		if (event.type === "checkout.session.completed") {
			const session = event.data.object as Stripe.Checkout.Session
			const appointmentId = session.metadata?.appointmentId
			if (appointmentId && session.id) {
				await ctx.runMutation(api.appointments.confirmFromCheckout, {
					stripeSessionId: session.id,
				})
			}
		}

		return new Response("OK", { status: 200 })
	}),
})

export default http
