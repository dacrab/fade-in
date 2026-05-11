import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { Scissors } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import PasswordInput from "#/components/ui/PasswordInput"
import { showToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import type { UserRole } from "#/types"

export const Route = createFileRoute("/register")({ component: RegisterPage })

function RegisterPage() {
	const { t } = useTranslation()
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [role, setRole] = useState<UserRole>("customer")
	const [loading, setLoading] = useState(false)
	const { register } = useAuth()
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!(name && email && password)) {
			showToast(t("errors.fillAllFields"), "error")
			return
		}
		if (password.length < 8) {
			showToast(t("errors.passwordLength"), "error")
			return
		}
		setLoading(true)
		try {
			await register(email, password, name, role)
			showToast(t("errors.accountCreated"), "success")
			void router.navigate({ to: role === "owner" ? "/business/overview" : "/dashboard/overview" })
		} catch {
			showToast(t("errors.registrationFailed"), "error")
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
					<h1 className="text-2xl font-bold text-[var(--text)] mb-1">{t("auth.registerTitle")}</h1>
					<p className="text-sm text-[var(--text-muted)]">{t("auth.registerSubtitle")}</p>
				</div>

				<div className="card p-6 sm:p-8">
					{/* Role toggle */}
					<div className="flex rounded-lg overflow-hidden border border-[var(--border)] mb-5">
						{(["customer", "owner"] as const).map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => setRole(r)}
								className={`btn-bare flex-1 py-2.5 text-sm font-semibold transition-colors ${role === r ? "bg-[var(--gold)] text-black" : "bg-[var(--bg-card)] text-[var(--text-muted)]"}`}
							>
								{r === "customer" ? t("auth.roleCustomer") : t("auth.roleOwner")}
							</button>
						))}
					</div>

					<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
						<div>
							<label className="form-label" htmlFor="reg-name">
								{t("auth.nameLabel")}
							</label>
							<input
								className="input"
								placeholder={t("auth.namePlaceholder")}
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								autoComplete="name"
							/>
						</div>
						<div>
							<label className="form-label" htmlFor="reg-email">
								{t("auth.emailLabel")}
							</label>
							<input
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
							<label className="form-label" htmlFor="reg-password">
								{t("auth.passwordLabel")}
							</label>
							<PasswordInput
								id="reg-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder={t("form.passwordMin")}
								autoComplete="new-password"
								required
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="btn btn-primary w-full justify-center py-3"
						>
							{loading ? t("auth.creatingAccount") : t("common.createAccount")}
						</button>
					</form>

					<p className="mt-4 text-xs text-center text-[var(--text-subtle)]">
						{t("auth.agreeTerms")}{" "}
						<a href="/terms" className="text-[var(--gold)] hover:underline">
							{t("auth.terms")}
						</a>
						{t("form.andSeparator")}
						<a href="/privacy" className="text-[var(--gold)] hover:underline">
							{t("auth.privacy")}
						</a>
					</p>

					<div className="mt-4 text-center text-sm text-[var(--text-muted)]">
						{t("auth.haveAccount")}{" "}
						<Link to="/login" className="text-[var(--gold)] hover:underline no-underline font-semibold">
							{t("common.signIn")}
						</Link>
					</div>
				</div>
			</div>
		</main>
	)
}
