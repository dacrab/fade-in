import { createFileRoute } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { Save } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import PageHeader from "#/components/PageHeader"
import { withToast } from "#/components/ui/Toast"
import { useAuth } from "#/hooks/useAuth"
import { useFormState } from "#/hooks/useFormState"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage })

function ProfilePage() {
	const { t } = useTranslation()
	const { user } = useAuth()
	const { form, set } = useFormState({ name: user?.name ?? "", phone: "" })
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
				<PageHeader
					back="/dashboard"
					backLabel={t("nav.dashboard")}
					title={t("dashboard.profileTitle")}
				/>

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
