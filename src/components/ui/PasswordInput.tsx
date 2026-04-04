import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"

interface Props {
	id: string
	value: string
	onChange: (v: string) => void
	placeholder?: string
	autoComplete?: string
}

export default function PasswordInput({ id, value, onChange, placeholder, autoComplete }: Props) {
	const [show, setShow] = useState(false)
	return (
		<div className="relative">
			<input
				id={id}
				type={show ? "text" : "password"}
				className="input pr-10"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required
				autoComplete={autoComplete}
			/>
			<button
				type="button"
				onClick={() => setShow((v) => !v)}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] btn-bare"
			>
				{show ? <EyeOff size={16} /> : <Eye size={16} />}
			</button>
		</div>
	)
}
