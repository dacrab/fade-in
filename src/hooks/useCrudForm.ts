import type { FormEvent } from "react"
import { useState } from "react"
import { withToast } from "#/components/ui/Toast"

interface CrudMessages {
	/** Toast after a successful create or update. */
	saved: string
	/** Toast after a successful delete. */
	removed: string
	/** Fallback toast when a mutation fails without a user-facing message. */
	failed: string
}

interface CrudFormOptions<TForm, TId> {
	/** Draft state before editing and after every successful save or reset. */
	empty: TForm
	/** Persist the draft, creating when `editId` is null; null when not ready to save. */
	save: (form: TForm, editId: TId | null) => Promise<unknown> | null
	/** Delete one record by id. */
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
		const result = await withToast(() => pending, messages.saved, messages.failed)
		if (result !== undefined) reset()
	}

	const removeRecord = (id: TId) => withToast(() => remove(id), messages.removed, messages.failed)

	return { form, setForm, showForm, editId, toggleForm, edit, submit, removeRecord, reset }
}
