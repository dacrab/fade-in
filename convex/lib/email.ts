import { Resend } from "resend"

export const DEFAULT_FROM = "FadeIn <noreply@fadein.app>"

export function getResend(): Resend | null {
	const key = process.env.RESEND_API_KEY
	return key ? new Resend(key) : null
}

export async function sendEmail(to: string, subject: string, html: string) {
	const resend = getResend()
	if (!resend) return
	await resend.emails.send({
		from: process.env.RESEND_FROM ?? DEFAULT_FROM,
		to: [to],
		subject,
		html,
	})
}
