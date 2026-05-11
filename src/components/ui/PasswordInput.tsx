import { Eye, EyeOff } from "lucide-react"
import type { InputHTMLAttributes } from "react"
import { useState } from "react"

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">

export default function PasswordInput({ className = "input pr-10", ...props }: Props) {
	const [show, setShow] = useState(false)
	return (
		<div className="relative">
			<input type={show ? "text" : "password"} className={className} {...props} />
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
