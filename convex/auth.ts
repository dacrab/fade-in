import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"
import { getResend } from "./lib/email"

export const { auth, signIn, signOut, store } = convexAuth({
	providers: [
		Password({
			profile(params) {
				return {
					email: params.email as string,
					name: (params.name as string) || "",
					role: (params.role as string) || "customer",
				}
			},
			reset: {
				id: "password-reset",
				type: "email",
				name: "Password Reset",
				from: process.env.RESEND_FROM ?? "noreply@fadein.app",
				maxAge: 60 * 60,
				sendVerificationRequest: async ({ identifier: email, url }) => {
					const resend = getResend()
					if (!resend) {
						// biome-ignore lint/suspicious/noConsole: operational warning when email not configured
						console.warn("RESEND_API_KEY not set — password reset email not sent")
						return
					}
					await resend.emails.send({
						from: process.env.RESEND_FROM ?? "FadeIn <noreply@fadein.app>",
						to: [email],
						subject: "Reset your FadeIn password",
						html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
					})
				},
			},
		}),
	],
	callbacks: {
		async createOrUpdateUser(ctx, { existingUserId, profile }) {
			if (existingUserId) {
				// Update: only patch fields that are provided and not already set
				const existing = await ctx.db.get(existingUserId)
				if (existing) {
					const updates: Record<string, string> = {}
					if (profile.name && !existing.name) updates.name = profile.name as string
					if (profile.role && !existing.role) updates.role = profile.role as string
					if (Object.keys(updates).length > 0) {
						await ctx.db.patch(existingUserId, updates)
					}
				}
				return existingUserId
			}
			// Create new user
			return ctx.db.insert("users", {
				email: profile.email as string,
				name: (profile.name as string) || undefined,
				role: (profile.role as "customer" | "owner" | "barber" | "admin") || "customer",
			})
		},
	},
})
