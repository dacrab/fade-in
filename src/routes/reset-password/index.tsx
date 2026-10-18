import { useSignIn } from "@clerk/tanstack-react-start"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { Scissors } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import PasswordInput from "#/components/ui/PasswordInput"
import { showToast } from "#/components/ui/Toast"

export const Route = createFileRoute("/reset-password/")({ component: ResetPasswordPage })

function ResetPasswordPage() {
	const { t } = useTranslation()
	const [step, setStep] = useState<"email" | "reset">("email")
	const [email, setEmail] = useState("")
	const [code, setCode] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [loading, setLoading] = useState(false)
	const { signIn } = useSignIn()
	const router = useRouter()

	const handleSendCode = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!signIn) return
		setLoading(true)
		try {
			const { error } = await signIn.create({ identifier: email })
			if (error) {
				showToast(error.message, "error")
				return
			}
			const result = await signIn.resetPasswordEmailCode.sendCode()
			if (result.error) {
				showToast(result.error.message, "error")
				return
			}
			setStep("reset")
			showToast(t("resetPassword.sentSuccess"), "success")
		} catch {
			showToast(t("resetPassword.sentFailed"), "error")
		} finally {
			setLoading(false)
		}
	}

	const handleReset = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!signIn) return
		setLoading(true)
		try {
			if (password.length < 8) {
				showToast(t("errors.passwordLength"), "error")
				return
			}
			if (password !== confirmPassword) {
				showToast(t("errors.passwordMismatch"), "error")
				return
			}
			const v = await signIn.resetPasswordEmailCode.verifyCode({ code })
			if (v.error) {
				showToast(v.error.message, "error")
				return
			}
			const s = await signIn.resetPasswordEmailCode.submitPassword({ password })
			if (s.error) {
				showToast(s.error.message, "error")
				return
			}
			if (signIn.status === "complete") {
				await signIn.finalize()
				showToast(t("resetPassword.resetSuccess"), "success")
				void router.navigate({ to: "/login" })
			}
		} catch {
			showToast(t("resetPassword.resetFailed"), "error")
		} finally {
			setLoading(false)
		}
	}

	const backToEmail = () => {
		setCode("")
		setPassword("")
		setConfirmPassword("")
		setStep("email")
	}

	return (
		<main className="auth-page">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<Link to="/" className="auth-logo">
						<div className="auth-logo-icon text-(--gold)">
							<Scissors size={20} className="text-black" />
						</div>
						<span className="page-title">
							Fade<span className="text-(--gold)">In</span>
						</span>
					</Link>
					<h1 className="page-title mb-1">{t("resetPassword.title")}</h1>
					<p className="muted-sm">{t("resetPassword.subtitle")}</p>
				</div>

				<div className="card p-6 sm:p-8">
					{step === "reset" ? (
						<form onSubmit={(e) => void handleReset(e)} className="space-y-4">
							<p className="muted-sm">{t("resetPassword.checkEmail")}</p>
							<div>
								<label className="form-label" htmlFor="reset-code">
									{t("resetPassword.codeLabel")}
								</label>
								<input
									id="reset-code"
									type="text"
									inputMode="numeric"
									className="input"
									placeholder={t("resetPassword.codePlaceholder")}
									value={code}
									onChange={(e) => setCode(e.target.value)}
									required
									disabled={loading}
									autoComplete="one-time-code"
								/>
							</div>
							<div>
								<label className="form-label" htmlFor="reset-password">
									{t("resetPassword.newPasswordLabel")}
								</label>
								<PasswordInput
									id="reset-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder={t("resetPassword.newPasswordPlaceholder")}
									autoComplete="new-password"
									required
									disabled={loading}
								/>
							</div>
							<div>
								<label className="form-label" htmlFor="reset-confirm-password">
									{t("resetPassword.confirmPasswordLabel")}
								</label>
								<PasswordInput
									id="reset-confirm-password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder={t("resetPassword.confirmPasswordLabel")}
									autoComplete="new-password"
									required
									disabled={loading}
								/>
							</div>
							<button
								type="submit"
								disabled={loading}
								className="btn btn-primary w-full justify-center py-3 mt-2"
							>
								{loading ? t("resetPassword.resetting") : t("resetPassword.resetButton")}
							</button>
							<button
								type="button"
								onClick={backToEmail}
								disabled={loading}
								className="btn w-full justify-center"
							>
								{t("common.back")}
							</button>
						</form>
					) : (
						<form onSubmit={(e) => void handleSendCode(e)} className="space-y-4">
							<div>
								<label className="form-label" htmlFor="reset-email">
									{t("resetPassword.emailLabel")}
								</label>
								<input
									id="reset-email"
									type="email"
									className="input"
									placeholder={t("resetPassword.emailPlaceholder")}
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
								{loading ? t("resetPassword.sending") : t("resetPassword.sendLink")}
							</button>
						</form>
					)}

					<div className="mt-6 text-center muted-sm">
						{t("resetPassword.rememberPassword")}{" "}
						<Link to="/login" className="text-(--gold) hover:underline no-underline font-semibold">
							{t("common.signIn")}
						</Link>
					</div>
				</div>
			</div>
		</main>
	)
}
