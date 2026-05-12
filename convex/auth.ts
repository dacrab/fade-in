import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"

export const { auth, signIn, signOut, store } = convexAuth({
	providers: [
		Password({
			reset: {
				id: "password-reset",
				type: "email",
				name: "Password Reset",
				from: "noreply@fadein.app",
				maxAge: 60 * 60, // 1 hour
				sendVerificationRequest: async ({ identifier: _email, token: _token, url: _url }) => {
					// In production, integrate an email provider (Resend, SendGrid, etc.)
					// to send the reset link to the user.
				},
			},
		}),
	],
})
