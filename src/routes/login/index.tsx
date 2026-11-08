import { useSignIn } from "@clerk/tanstack-react-start"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import type { FormEvent } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import AuthShell from "#/components/AuthShell"
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

	const handleSubmit = async (e: FormEvent) => {
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
				showToast(t("auth.welcomeBack"), "success")
				void router.navigate({ to: "/dashboard/overview" })
			}
		} catch {
			showToast(t("errors.loginFailed"), "error")
		} finally {
			setLoading(false)
		}
	}

	return (
		<AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
			<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
				<div>
					<label className="field-label" htmlFor="login-email">
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
					<label className="field-label" htmlFor="login-password">
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
				<button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3">
					{loading ? t("auth.signingIn") : t("common.signIn")}
				</button>
			</form>

			<div className="mt-6 flex flex-col gap-2 border-t border-(--border) pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
				<p className="muted-sm m-0">
					{t("auth.noAccount")}{" "}
					<Link to="/register" className="font-semibold text-(--gold) hover:underline">
						{t("common.createAccount")}
					</Link>
				</p>
				<Link
					to="/reset-password"
					className="shrink-0 text-[11px] font-medium text-(--text-subtle) hover:text-(--text)"
				>
					{t("auth.forgotPassword")}
				</Link>
			</div>
		</AuthShell>
	)
}
