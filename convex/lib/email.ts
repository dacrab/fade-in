import { Resend } from "resend"

function getResend(): Resend | null {
	const key = process.env.RESEND_API_KEY
	return key ? new Resend(key) : null
}

export async function sendEmail(to: string, subject: string, html: string) {
	const resend = getResend()
	if (!resend) {
		console.warn("RESEND_API_KEY not set — email not sent")
		return
	}
	await resend.emails.send({
		from: process.env.RESEND_FROM ?? "FadeIn <noreply@fadein.app>",
		to: [to],
		subject,
		html,
	})
}
