import { httpRouter } from "convex/server"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"

const http = httpRouter()

const WEBHOOK_TIMESTAMP_TOLERANCE_S = 300

const enc = new TextEncoder()

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
	const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
	}
	return bytes
}

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

	try {
		const key = await crypto.subtle.importKey(
			"raw",
			enc.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"],
		)
		// WebCrypto's verify performs the comparison in constant time.
		return await crypto.subtle.verify(
			"HMAC",
			key,
			hexToBytes(sig),
			enc.encode(`${timestamp}.${payload}`),
		)
	} catch {
		return false
	}
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

		const checkoutId = event.data?.id
		if (typeof checkoutId !== "string" || !checkoutId) {
			return new Response("OK", { status: 200 })
		}

		// A completed checkout arrives as checkout.updated with status "succeeded";
		// checkout.created only signals initiation. An expired checkout releases
		// the slot it was holding.
		const succeeded =
			(event.type === "checkout.created" || event.type === "checkout.updated") &&
			event.data?.status === "succeeded"
		if (succeeded) {
			await ctx.runMutation(internal.appointments.confirmFromCheckout, {
				polarCheckoutId: checkoutId,
			})
		} else if (event.type === "checkout.expired") {
			await ctx.runMutation(internal.appointments.removeUnpaidOrphanById, {
				polarCheckoutId: checkoutId,
			})
		}

		return new Response("OK", { status: 200 })
	}),
})

export default http
