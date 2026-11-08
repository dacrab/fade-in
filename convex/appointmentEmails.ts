import { v } from "convex/values"
import { internalAction } from "./_generated/server"
import { sendEmail } from "./lib/email"

export const sendBookingConfirmationEmail = internalAction({
	args: {
		to: v.string(),
		customerName: v.optional(v.string()),
		shopName: v.optional(v.string()),
		barberName: v.optional(v.string()),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		totalPrice: v.number(),
	},
	handler: async (_ctx, args) => {
		try {
			await sendEmail(
				args.to,
				`Booking Confirmed — ${args.shopName ?? "Barbershop"}`,
				`<p>Hi ${args.customerName ?? "there"},</p>
				<p>Your booking at <strong>${args.shopName ?? "Barbershop"}</strong> is confirmed!</p>
				<p><strong>Barber:</strong> ${args.barberName ?? "—"}<br>
				<strong>Date:</strong> ${args.date}<br>
				<strong>Time:</strong> ${args.startTime} – ${args.endTime}<br>
				<strong>Total:</strong> €${(args.totalPrice / 100).toFixed(2)}</p>
				<p>See you there!<br>— The FadeIn Team</p>`,
			)
		} catch {
			// Best-effort email: a delivery failure must not fail the booking.
		}
	},
})

export const sendNewBookingNotification = internalAction({
	args: {
		to: v.string(),
		customerName: v.optional(v.string()),
		shopName: v.optional(v.string()),
		barberName: v.optional(v.string()),
		date: v.string(),
		startTime: v.string(),
		endTime: v.string(),
		totalPrice: v.number(),
	},
	handler: async (_ctx, args) => {
		try {
			await sendEmail(
				args.to,
				`New booking request — ${args.shopName ?? "Barbershop"}`,
				`<p>You have a new booking request at <strong>${args.shopName ?? "Barbershop"}</strong>.</p>
				<p><strong>Customer:</strong> ${args.customerName ?? "—"}<br>
				<strong>Barber:</strong> ${args.barberName ?? "—"}<br>
				<strong>Date:</strong> ${args.date}<br>
				<strong>Time:</strong> ${args.startTime} – ${args.endTime}<br>
				<strong>Total:</strong> €${(args.totalPrice / 100).toFixed(2)}</p>
				<p>— The FadeIn Team</p>`,
			)
		} catch {
			// Best-effort email: a delivery failure must not affect the booking.
		}
	},
})
