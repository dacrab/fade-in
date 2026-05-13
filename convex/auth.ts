import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"

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
				from: "noreply@fadein.app",
				maxAge: 60 * 60,
				sendVerificationRequest: async ({ identifier: _email, token: _token, url: _url }) => {
					// In production, integrate an email provider (Resend, SendGrid, etc.)
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
