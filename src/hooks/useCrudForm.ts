import type { FormEvent } from "react"
import { useState } from "react"
import { withToast } from "#/components/ui/Toast"

interface CrudMessages {
	saved: string
	removed: string
	failed: string
}

interface CrudFormOptions<TForm, TId> {
	empty: TForm
	/** Persist the draft (creating when `editId` is null); return null when not ready to save. */
	save: (form: TForm, editId: TId | null) => Promise<unknown> | null
	remove: (id: TId) => Promise<unknown>
	messages: CrudMessages
}

/**
 * Draft-form state behind the business CRUD pages: tracks the form and its edit
 * target, and routes saves and deletes through toast feedback.
 */
export function useCrudForm<TForm, TId>({
	empty,
	save,
	remove,
	messages,
}: CrudFormOptions<TForm, TId>) {
	const [form, setForm] = useState<TForm>(empty)
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<TId | null>(null)
	const [saving, setSaving] = useState(false)

	const reset = () => {
		setForm(empty)
		setEditId(null)
		setShowForm(false)
	}

	const toggleForm = () => {
		const next = !showForm
		reset()
		setShowForm(next)
	}

	const edit = (id: TId, draft: TForm) => {
		setForm(draft)
		setEditId(id)
		setShowForm(true)
	}

	const submit = async (e: FormEvent) => {
		e.preventDefault()
		const pending = save(form, editId)
		if (pending === null) return
		setSaving(true)
		const { ok } = await withToast(() => pending, messages.saved, messages.failed)
		setSaving(false)
		if (ok) reset()
	}

	const removeRecord = (id: TId) => withToast(() => remove(id), messages.removed, messages.failed)

	return { form, setForm, showForm, editId, saving, toggleForm, edit, submit, removeRecord, reset }
}
