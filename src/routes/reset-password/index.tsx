import { useSignIn } from "@clerk/tanstack-react-start"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Scissors } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { showToast } from "#/components/ui/Toast"

export const Route = createFileRoute("/reset-password/")({ component: ResetPasswordPage })

function ResetPasswordPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)
	const [sent, setSent] = useState(false)
	const { signIn } = useSignIn()

	const handleSubmit = async (e: React.FormEvent) => {
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
			setSent(true)
			showToast(t("resetPassword.sentSuccess"), "success")
		} catch {
			showToast(t("resetPassword.sentFailed"), "error")
		} finally {
			setLoading(false)
		}
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
					{sent ? (
						<div className="text-center text-(--text-muted)">
							<p>{t("resetPassword.checkEmail")}</p>
							<Link to="/login" className="text-(--gold) hover:underline mt-4 inline-block">
								{t("resetPassword.backToLogin")}
							</Link>
						</div>
					) : (
						<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
