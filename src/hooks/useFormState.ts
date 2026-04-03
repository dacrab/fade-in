import { useState } from "react"

/**
 * Manages a simple object-shaped form with show/edit state.
 * Returns the form value, a field setter factory, and reset/open helpers.
 */
export function useFormState<T extends Record<string, string>>(empty: T) {
	const [form, setForm] = useState<T>(empty)
	const [showForm, setShowForm] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)

	const set =
		(key: keyof T) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
			setForm((f) => ({ ...f, [key]: e.target.value }))

	const reset = () => {
		setForm(empty)
		setEditId(null)
		setShowForm(false)
	}

	const openCreate = () => {
		setForm(empty)
		setEditId(null)
		setShowForm(true)
	}

	const openEdit = (values: T, id: string) => {
		setForm(values)
		setEditId(id)
		setShowForm(true)
	}

	return { form, setForm, showForm, setShowForm, editId, set, reset, openCreate, openEdit }
}
