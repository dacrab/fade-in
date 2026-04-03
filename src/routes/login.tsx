import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { Eye, EyeOff, Scissors } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { showToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"

export const Route = createFileRoute("/login")({ component: LoginPage })

function LoginPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPass, setShowPass] = useState(false)
	const [loading, setLoading] = useState(false)
	const { login } = useAuth()
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			await login(email, password)
			showToast(t("errors.welcomeBack"), "success")
			void router.navigate({ to: "/dashboard" })
		} catch {
			showToast(t("errors.loginFailed"), "error")
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="auth-page">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<Link to="/" className="auth-logo">
						<div className="auth-logo-icon gold-gradient">
							<Scissors size={20} className="text-black" />
						</div>
						<span className="text-2xl font-bold text-[var(--text)]">
							Fade<span className="gold-text">In</span>
						</span>
					</Link>
					<h1 className="text-2xl font-bold text-[var(--text)] mb-1">{t("auth.loginTitle")}</h1>
					<p className="text-sm text-[var(--text-muted)]">{t("auth.loginSubtitle")}</p>
				</div>

				<div className="card p-6 sm:p-8">
					<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
						<div>
							<label className="form-label" htmlFor="login-email">
								{t("auth.emailLabel")}
							</label>
							<input
								id="login-email"
								type="email"
								className="input"
								placeholder={t("auth.emailPlaceholder")}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoComplete="email"
							/>
						</div>
						<div>
							<label className="form-label" htmlFor="login-password">
								{t("auth.passwordLabel")}
							</label>
							<div className="relative">
								<input
									id="login-password"
									type={showPass ? "text" : "password"}
									className="input pr-10"
									placeholder={t("auth.passwordPlaceholder")}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoComplete="current-password"
								/>
								<button
									type="button"
									onClick={() => setShowPass((v) => !v)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] btn-bare"
								>
									{showPass ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="btn btn-primary w-full justify-center py-3 mt-2"
						>
							{loading ? t("auth.signingIn") : t("common.signIn")}
						</button>
					</form>

					<div className="mt-6 text-center text-sm text-[var(--text-muted)]">
						{t("auth.noAccount")}{" "}
						<Link to="/register" className="text-[var(--gold)] hover:underline no-underline font-semibold">
							{t("common.createAccount")}
						</Link>
					</div>
				</div>
			</div>
		</main>
	)
}
