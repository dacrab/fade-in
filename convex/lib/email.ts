import { Resend } from "resend"

export const DEFAULT_FROM = "FadeIn <noreply@fadein.app>"

export function getResend(): Resend | null {
	const key = process.env.RESEND_API_KEY
	return key ? new Resend(key) : null
}

export async function sendEmail(to: string, subject: string, html: string) {
	const resend = getResend()
	if (!resend) return
	const { error } = await resend.emails.send({
		from: process.env.RESEND_FROM ?? DEFAULT_FROM,
		to: [to],
		subject,
		html,
	})
	if (error) {
		// Best-effort email: never fail the booking over a delivery error, but
		// don't swallow the failure silently either.
		// biome-ignore lint/suspicious/noConsole: delivery-failure logging for observability
		console.error(`Resend delivery failed (${error.name}): ${error.message}`)
	}
}
