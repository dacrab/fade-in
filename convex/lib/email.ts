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

export function confirmationEmailHtml(opts: {
	customerName: string
	shopName: string
	barberName: string
	date: string
	startTime: string
	endTime: string
	total: string
	manageUrl: string
}) {
	return `<p>Hi ${opts.customerName},</p>
		<p>Your booking at <strong>${opts.shopName}</strong> is confirmed!</p>
		<p><strong>Barber:</strong> ${opts.barberName}<br>
		<strong>Date:</strong> ${opts.date}<br>
		<strong>Time:</strong> ${opts.startTime} – ${opts.endTime}<br>
		<strong>Total:</strong> ${opts.total}</p>
		<p><a href="${opts.manageUrl}">Manage your booking</a> — cancel or reschedule anytime.</p>
		<p>See you there!<br>— The FadeIn Team</p>`
}

export function reminderEmailHtml(opts: {
	customerName: string
	shopName: string
	barberName: string
	date: string
	startTime: string
	endTime: string
	manageUrl: string
}) {
	return `<p>Hi ${opts.customerName},</p>
		<p>This is a friendly reminder about your appointment at <strong>${opts.shopName}</strong>.</p>
		<p><strong>Barber:</strong> ${opts.barberName}<br>
		<strong>Date:</strong> ${opts.date}<br>
		<strong>Time:</strong> ${opts.startTime} – ${opts.endTime}</p>
		<p><a href="${opts.manageUrl}">Manage your booking</a></p>
		<p>See you there!<br>— The FadeIn Team</p>`
}
