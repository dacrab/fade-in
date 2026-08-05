import { useSignUp } from "@clerk/tanstack-react-start"
import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { Scissors } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import PasswordInput from "#/components/ui/PasswordInput"
import { showToast } from "#/components/ui/Toast"
import type { UserRole } from "#/types"

const searchSchema = z.object({
	role: z.enum(["customer", "owner"]).optional(),
})

const STRENGTH_STYLE: Record<string, { bar: string; text: string }> = {
	weak: { bar: "bg-(--strength-weak)", text: "text-(--strength-weak)" },
	fair: { bar: "bg-(--strength-fair)", text: "text-(--strength-fair)" },
	good: { bar: "bg-(--strength-good)", text: "text-(--strength-good)" },
	strong: { bar: "bg-(--strength-strong)", text: "text-(--strength-strong)" },
}

const getStrength = (pw: string) => {
	if (!pw) return { score: 0, key: "weak" }
	let s = 0
	if (pw.length >= 8) s++
	if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
	if (/\d/.test(pw)) s++
	if (/[^A-Za-z0-9]/.test(pw)) s++
	if (s <= 1) return { score: 1, key: "weak" }
	if (s === 2) return { score: 2, key: "fair" }
	if (s === 3) return { score: 3, key: "good" }
	return { score: 4, key: "strong" }
}

export const Route = createFileRoute("/register/")({
	validateSearch: searchSchema,
	component: RegisterPage,
})

function RegisterPage() {
	const { t } = useTranslation()
	const { role: roleParam } = Route.useSearch()
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [role, setRole] = useState<UserRole>(roleParam ?? "customer")
	const [loading, setLoading] = useState(false)
	const { signUp } = useSignUp()
	const router = useRouter()

	const strength = getStrength(password)

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
		if (password !== confirmPassword) {
			showToast(t("errors.passwordMismatch"), "error")
			return
		}
		if (!signUp) return
		setLoading(true)
		try {
			const { error } = await signUp.create({
				emailAddress: email,
				password,
				firstName: name,
			})
			if (error) {
				showToast(error.message, "error")
				return
			}
			if (signUp.status === "complete") {
				await signUp.finalize()
				showToast(t("errors.accountCreated"), "success")
				void router.navigate({ to: role === "owner" ? "/business/overview" : "/dashboard/overview" })
			}
		} catch {
			showToast(t("errors.registrationFailed"), "error")
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
					<h1 className="page-title mb-1 text-center">{t("auth.registerTitle")}</h1>
					<p className="muted-sm mb-6 text-center">{t("auth.registerSubtitle")}</p>

					<div className="flex rounded-lg bg-(--bg) border border-(--border) p-1 mb-6">
						{(["customer", "owner"] as const).map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => setRole(r)}
								className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${role === r ? "bg-(--gold) text-white shadow-sm" : "text-(--text-muted) hover:text-(--text)"}`}
							>
								{r === "customer" ? t("auth.roleCustomer") : t("auth.roleOwner")}
							</button>
						))}
					</div>

					<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
						<div>
							<label className="block strong-sm mb-1.5" htmlFor="reg-name">
								{t("auth.nameLabel")}
							</label>
							<input
								id="reg-name"
								className="input"
								placeholder={t("auth.namePlaceholder")}
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								autoComplete="name"
							/>
						</div>
						<div>
							<label className="block strong-sm mb-1.5" htmlFor="reg-email">
								{t("auth.emailLabel")}
							</label>
							<input
								id="reg-email"
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
							<label className="block strong-sm mb-1.5" htmlFor="reg-password">
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
							{password.length > 0 && (
								<div className="mt-2">
									<div className="flex gap-1">
										{[1, 2, 3, 4].map((i) => (
											<div
												key={i}
												className={`h-1 flex-1 rounded-full transition-colors duration-200 ${i <= strength.score ? STRENGTH_STYLE[strength.key].bar : "bg-(--border)"}`}
											/>
										))}
									</div>
									<p className={`text-xs mt-1 ${STRENGTH_STYLE[strength.key].text}`}>
										{t(`auth.strength.${strength.key}`)}
									</p>
								</div>
							)}
						</div>
						<div>
							<label className="block strong-sm mb-1.5" htmlFor="reg-confirm">
								{t("auth.confirmPasswordLabel")}
							</label>
							<PasswordInput
								id="reg-confirm"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder={t("auth.confirmPasswordPlaceholder")}
								autoComplete="new-password"
								required
							/>
							{confirmPassword.length > 0 && password !== confirmPassword && (
								<p className="text-xs text-(--error) mt-1">{t("errors.passwordMismatch")}</p>
							)}
						</div>
						<button
							type="submit"
							disabled={loading}
							className="btn btn-primary w-full justify-center py-3"
						>
							{loading ? t("auth.creatingAccount") : t("common.createAccount")}
						</button>
					</form>

					<p className="mt-5 text-xs text-center text-(--text-subtle)">
						{t("auth.agreeTerms")}{" "}
						<a
							href="/terms"
							className="text-(--gold)/70 hover:text-(--gold) hover:underline no-underline"
						>
							{t("auth.terms")}
						</a>
						{t("form.andSeparator")}
						<a
							href="/privacy"
							className="text-(--gold)/70 hover:text-(--gold) hover:underline no-underline"
						>
							{t("auth.privacy")}
						</a>
					</p>

					<p className="mt-4 text-center muted-sm">
						{t("auth.haveAccount")}{" "}
						<Link to="/login" className="text-(--gold) hover:underline no-underline font-medium">
							{t("common.signIn")}
						</Link>
					</p>
				</div>
			</div>
		</main>
	)
}
