import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "../../hooks/useAuth"
import { showToast } from "../../components/ui/Toast"
import { Save } from "lucide-react"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage })

function ProfilePage() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const [name, setName] = useState(user?.name ?? "")
	const [phone, setPhone] = useState("")
	const [saving, setSaving] = useState(false)
	const updateProfile = useMutation(api.users.updateProfile)

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) return
		setSaving(true)
		try {
			await updateProfile({ id: user.id as Id<"users">, name, phone: phone || undefined })
			showToast(t("errors.profileSaved"), "success")
		} catch {
			showToast(t("errors.profileFailed"), "error")
		} finally {
			setSaving(false)
		}
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-xl">
				<div className="page-header">
					<Link to="/dashboard" className="breadcrumb-back">
						← {t("nav.dashboard")}
					</Link>
					<span className="text-[var(--border)]">/</span>
					<h1 className="text-2xl font-bold text-[var(--text)]">{t("dashboard.profileTitle")}</h1>
				</div>

				<div className="card p-6">
					<div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
						<div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: "var(--gold)", color: "#000" }}>
							{user?.name.charAt(0).toUpperCase()}
						</div>
						<div>
							<h2 className="font-bold text-[var(--text)]">{user?.name}</h2>
							<p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
							<span className="badge badge-gold mt-1">{user?.role}</span>
						</div>
					</div>

					<form onSubmit={(e) => void handleSave(e)} className="space-y-4">
						<div>
							<label className="form-label">{t("auth.nameLabel")}</label>
							<input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.namePlaceholder")} />
						</div>
						<div>
							<label className="form-label">{t("form.phoneLabel")}</label>
							<input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("dashboard.phonePlaceholder")} type="tel" />
						</div>
						<div>
							<label className="form-label">{t("auth.emailLabel")}</label>
							<input className="input opacity-50 cursor-not-allowed" value={user?.email} disabled />
							<p className="text-xs text-[var(--text-muted)] mt-1">{t("dashboard.emailNote")}</p>
						</div>
						<button type="submit" disabled={saving} className="btn btn-primary gap-2">
							<Save size={15} />{saving ? t("common.loading") : t("common.save")}
						</button>
					</form>
				</div>
			</div>
		</main>
	)
}
