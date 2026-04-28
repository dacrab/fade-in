import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { withToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

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
			() =>
				updateProfile({ id: user.id as Id<"users">, name: form.name, phone: form.phone || undefined }),
			t("errors.profileSaved"),
			t("errors.profileFailed"),
		)
		setSaving(false)
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-xl">
				<div className="mb-6">
					<Link
						to="/dashboard"
						className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-2"
					>
						<ArrowLeft size={14} />
						{t("nav.dashboard")}
					</Link>
					<h1 className="text-2xl font-bold text-[var(--text)]">{t("dashboard.profileTitle")}</h1>
				</div>

				<div className="card p-6">
					<div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
						<div className="avatar avatar-lg">{user?.name.charAt(0).toUpperCase()}</div>
						<div>
							<h2 className="font-bold text-[var(--text)]">{user?.name}</h2>
							<p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
							<span className="badge badge-gold mt-1">{user?.role}</span>
						</div>
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
							<input
								id="profile-email"
								className="input opacity-50 cursor-not-allowed"
								value={user?.email}
								disabled
							/>
							<p className="text-xs text-[var(--text-muted)] mt-1">{t("dashboard.emailNote")}</p>
						</div>
						<button type="submit" disabled={saving} className="btn btn-primary gap-2">
							<Save size={15} />
							{saving ? t("common.loading") : t("common.save")}
						</button>
					</form>
				</div>
			</div>
		</main>
	)
}
