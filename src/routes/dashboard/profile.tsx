import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { withToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage })

function ProfilePage() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const [form, setForm] = useState({ name: user?.name ?? "", phone: "" })
	const set = (key: "name" | "phone") => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((prev) => ({ ...prev, [key]: e.target.value }))
	const [saving, setSaving] = useState(false)
	const updateProfile = useMutation(api.users.updateProfile)

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) return
		setSaving(true)
		await withToast(
			() => updateProfile({ id: user.id, name: form.name, phone: form.phone || undefined }),
			t("errors.profileSaved"),
			t("errors.profileFailed"),
		)
		setSaving(false)
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-lg py-8">
				<Link
					to="/dashboard/overview"
					className="inline-flex items-center gap-1.5 text-xs text-(--text-muted) hover:text-(--text) mb-4"
				>
					<ArrowLeft size={12} /> {t("nav.dashboard")}
				</Link>
				<h1 className="text-2xl font-bold text-(--text) mb-6">{t("dashboard.profileTitle")}</h1>

				<div className="card p-6">
					{/* User info */}
					<div className="flex items-center gap-3 mb-6 pb-5 border-b border-(--border)">
						<div className="w-10 h-10 rounded-lg bg-(--gold)/10 flex items-center justify-center text-sm font-bold text-(--gold)">
							{(user?.name ?? user?.email)?.[0]?.toUpperCase() ?? "?"}
						</div>
						<div>
							<div className="text-sm font-medium text-(--text)">{user?.name ?? user?.email}</div>
							<div className="text-xs text-(--text-muted)">{user?.email}</div>
						</div>
						<span className="ml-auto badge badge-gold text-[10px]">{user?.role}</span>
					</div>

					<form onSubmit={(e) => void handleSave(e)} className="space-y-4">
						<div>
							<label className="form-label" htmlFor="profile-name">
								{t("auth.nameLabel")}
							</label>
							<input
								className="input"
								value={form.name}
								onChange={set("name")}
								placeholder={t("auth.namePlaceholder")}
							/>
						</div>
						<div>
							<label className="form-label" htmlFor="profile-phone">
								{t("form.phoneLabel")}
							</label>
							<input
								className="input"
								value={form.phone}
								onChange={set("phone")}
								placeholder={t("dashboard.phonePlaceholder")}
								type="tel"
							/>
						</div>
						<div>
							<label className="form-label" htmlFor="profile-email">
								{t("auth.emailLabel")}
							</label>
							<input className="input opacity-50 cursor-not-allowed" value={user?.email} disabled />
							<p className="text-xs text-(--text-subtle) mt-1">{t("dashboard.emailNote")}</p>
						</div>
						<button type="submit" disabled={saving} className="btn btn-primary gap-2">
							<Save size={14} />
							{saving ? t("common.loading") : t("common.save")}
						</button>
					</form>
				</div>
			</div>
		</main>
	)
}
