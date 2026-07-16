import { httpRouter } from "convex/server"
import { api } from "./_generated/api"
import { httpAction } from "./_generated/server"

const http = httpRouter()

const WEBHOOK_TIMESTAMP_TOLERANCE_S = 300

const enc = new TextEncoder()
const toHex = (buf: ArrayBuffer): string =>
	Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("")

async function verifySignature(payload: string, header: string, secret: string): Promise<boolean> {
	const parts: Record<string, string | undefined> = Object.fromEntries(
		header.split(",").map((p) => {
			const [key, ...rest] = p.split("=")
			return [key, rest.join("=")]
		}),
	)
	const { t: timestamp, v1: sig } = parts
	if (!(timestamp && sig)) return false
	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > WEBHOOK_TIMESTAMP_TOLERANCE_S) return false

	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	)
	const signed = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${payload}`))
	return toHex(signed) === sig
}

http.route({
	path: "/polar-webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const body = await request.text()
		const signature = request.headers.get("webhook-signature")
		if (!signature) return new Response("Missing signature", { status: 400 })

		const secret = process.env.POLAR_WEBHOOK_SECRET
		if (!secret) return new Response("Missing Polar webhook secret", { status: 500 })

		if (!(await verifySignature(body, signature, secret))) {
			return new Response("Invalid signature", { status: 400 })
		}

		const event = JSON.parse(body)

		if (
			typeof event.type === "string" &&
			event.type === "checkout.created" &&
			typeof event.data?.status === "string" &&
			event.data.status === "succeeded"
		) {
			const checkoutId = event.data.id
			if (typeof checkoutId === "string" && checkoutId) {
				await ctx.runMutation(api.appointments.confirmFromCheckout, {
					polarCheckoutId: checkoutId,
				})
			}
		}

		return new Response("OK", { status: 200 })
	}),
})

export default http
