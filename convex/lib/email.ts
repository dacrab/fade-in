import { Resend } from "resend"

export const DEFAULT_FROM = "FadeIn <noreply@fadein.app>"

export function getResend(): Resend | null {
	const key = process.env.RESEND_API_KEY
	return key ? new Resend(key) : null
}

/** Send an email notification via Resend. Returns silently if not configured. */
export async function sendEmail(to: string, subject: string, html: string) {
	const resend = getResend()
	if (!resend) {
		// biome-ignore lint/suspicious/noConsole: operational warning when email not configured
		console.warn("RESEND_API_KEY not set — email not sent")
		return
	}
	await resend.emails.send({
		from: process.env.RESEND_FROM ?? DEFAULT_FROM,
		to: [to],
		subject,
		html,
	})
}
