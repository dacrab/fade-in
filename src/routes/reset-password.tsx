import { createFileRoute, Link } from "@tanstack/react-router"
import { Scissors } from "lucide-react"
import { useState } from "react"
import { showToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage })

function ResetPasswordPage() {
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)
	const { signIn } = useAuth()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			await signIn("password", { email, flow: "reset" })
			setSent(true)
			showToast("Reset instructions sent to your email", "success")
		} catch {
			showToast("Failed to send reset email", "error")
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="auth-page">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<Link to="/home" className="auth-logo">
						<div className="auth-logo-icon gold-gradient">
							<Scissors size={20} className="text-black" />
						</div>
						<span className="text-2xl font-bold text-[var(--text)]">
							Fade<span className="gold-text">In</span>
						</span>
					</Link>
					<h1 className="text-2xl font-bold text-[var(--text)] mb-1">Reset Password</h1>
					<p className="text-sm text-[var(--text-muted)]">
						Enter your email to receive reset instructions
					</p>
				</div>

				<div className="card p-6 sm:p-8">
					{sent ? (
						<div className="text-center text-[var(--text-muted)]">
							<p>Check your email for reset instructions.</p>
							<Link to="/login" className="text-[var(--gold)] hover:underline mt-4 inline-block">
								Back to login
							</Link>
						</div>
					) : (
						<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
							<div>
								<label className="form-label" htmlFor="reset-email">
									Email
								</label>
								<input
									id="reset-email"
									type="email"
									className="input"
									placeholder="your@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									autoComplete="email"
								/>
							</div>
							<button
								type="submit"
								disabled={loading}
								className="btn btn-primary w-full justify-center py-3 mt-2"
							>
								{loading ? "Sending..." : "Send Reset Link"}
							</button>
						</form>
					)}

					<div className="mt-6 text-center text-sm text-[var(--text-muted)]">
						Remember your password?{" "}
						<Link
							to="/login"
							className="text-[var(--gold)] hover:underline no-underline font-semibold"
						>
							Sign in
						</Link>
					</div>
				</div>
			</div>
		</main>
	)
}
