import { httpRouter } from "convex/server"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"

const http = httpRouter()

const WEBHOOK_TIMESTAMP_TOLERANCE_S = 300

const enc = new TextEncoder()
const toHex = (buf: ArrayBuffer) =>
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

		let event: { type?: unknown; data?: { status?: unknown; id?: unknown } }
		try {
			event = JSON.parse(body)
		} catch {
			return new Response("Invalid JSON", { status: 400 })
		}

		if (event.type === "checkout.created" && event.data?.status === "succeeded") {
			const checkoutId = event.data.id
			if (typeof checkoutId === "string" && checkoutId) {
				await ctx.runMutation(internal.appointments.confirmFromCheckout, {
					polarCheckoutId: checkoutId,
				})
			}
		}

		return new Response("OK", { status: 200 })
	}),
})

export default http
