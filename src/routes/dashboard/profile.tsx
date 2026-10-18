import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { ArrowLeft, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { withToast } from "#/components/ui/Toast"
import { parseUserRole } from "#/types"
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage })

function ProfilePage() {
	const { t } = useTranslation()
	const viewer = useQuery(api.users.getViewer)
	const [form, setForm] = useState({ name: "", phone: "" })
	const set = (key: "name" | "phone") => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((prev) => ({ ...prev, [key]: e.target.value }))
	const [saving, setSaving] = useState(false)
	const updateProfile = useMutation(api.users.updateProfile)

	useEffect(() => {
		if (!viewer) return
		setForm({ name: viewer.name ?? viewer.email, phone: viewer.phone ?? "" })
	}, [viewer])

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!viewer) return
		setSaving(true)
		await withToast(
			() => updateProfile({ id: viewer._id, name: form.name, phone: form.phone || undefined }),
			t("dashboard.profileSaved"),
			t("errors.profileFailed"),
		)
		setSaving(false)
	}

	return (
		<main className="page-main">
			<div className="page-wrap max-w-lg py-8">
				<Link
					to="/dashboard/overview"
					className="inline-flex items-center gap-1.5 muted-xs hover:text-(--text) mb-4"
				>
					<ArrowLeft size={12} /> {t("nav.dashboard")}
				</Link>
				<h1 className="page-title mb-6">{t("dashboard.profileTitle")}</h1>

				<div className="card p-6">
					<div className="flex items-center gap-3 mb-6 pb-5 border-b border-(--border)">
						<div className="w-10 h-10 rounded-lg bg-(--gold)/10 flex items-center justify-center text-sm font-bold text-(--gold)">
							{(viewer?.name ?? viewer?.email)?.[0]?.toUpperCase() ?? "?"}
						</div>
						<div>
							<div className="strong-sm">{viewer?.name ?? viewer?.email}</div>
							<div className="muted-xs">{viewer?.email}</div>
						</div>
						<span className="ml-auto badge badge-gold text-[10px]">{parseUserRole(viewer?.role)}</span>
					</div>

					<form onSubmit={(e) => void handleSave(e)} className="space-y-4">
						<div>
							<label className="form-label" htmlFor="profile-name">
								{t("auth.nameLabel")}
							</label>
							<input
								id="profile-name"
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
								id="profile-phone"
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
								value={viewer?.email}
								disabled
							/>
							<p className="subtle-xs mt-1">{t("dashboard.emailNote")}</p>
						</div>
						<button type="submit" disabled={saving || !viewer} className="btn btn-primary gap-2">
							<Save size={14} />
							{saving ? t("common.loading") : t("common.save")}
						</button>
					</form>
				</div>
			</div>
		</main>
	)
}
