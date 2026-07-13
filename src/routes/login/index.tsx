import { useSignIn } from "@clerk/tanstack-react-start"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { Scissors } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import PasswordInput from "#/components/ui/PasswordInput"
import { showToast } from "#/components/ui/Toast"

export const Route = createFileRoute("/login/")({ component: LoginPage })

function LoginPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [loading, setLoading] = useState(false)
	const { signIn } = useSignIn()
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!signIn) return
		setLoading(true)
		try {
			const { error } = await signIn.create({ identifier: email, password })
			if (error) {
				showToast(error.message, "error")
				return
			}
			if (signIn.status === "complete") {
				await signIn.finalize()
				showToast(t("errors.welcomeBack"), "success")
				void router.navigate({ to: "/dashboard/overview" })
			}
		} catch {
			showToast(t("errors.loginFailed"), "error")
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="flex-1 flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-sm">
				<Link to="/" className="flex items-center justify-center gap-2 mb-5 no-underline">
					<div className="w-9 h-9 rounded-lg bg-(--gold) flex items-center justify-center">
						<Scissors size={16} className="text-white" />
					</div>
					<span className="text-lg font-bold text-(--text)">
						Fade<span className="text-(--gold)">In</span>
					</span>
				</Link>

				<div className="bg-(--bg-card) rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8">
					<h1 className="text-2xl font-bold text-(--text) mb-1 text-center">{t("auth.loginTitle")}</h1>
					<p className="text-sm text-(--text-muted) mb-6 text-center">{t("auth.loginSubtitle")}</p>

					<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-(--text) mb-1.5" htmlFor="login-email">
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
							<label className="block text-sm font-medium text-(--text) mb-1.5" htmlFor="login-password">
								{t("auth.passwordLabel")}
							</label>
							<PasswordInput
								id="login-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder={t("auth.passwordPlaceholder")}
								autoComplete="current-password"
								required
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="btn btn-primary w-full justify-center py-3"
						>
							{loading ? t("auth.signingIn") : t("common.signIn")}
						</button>
					</form>

					<p className="mt-6 text-center text-sm text-(--text-muted)">
						{t("auth.noAccount")}{" "}
						<Link to="/register" className="text-(--gold) hover:underline font-medium">
							{t("common.createAccount")}
						</Link>
					</p>
				</div>
			</div>
		</main>
	)
}
