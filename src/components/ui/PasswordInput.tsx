import { Eye, EyeOff } from "lucide-react"
import type { InputHTMLAttributes } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">

export default function PasswordInput({ className = "input pr-11", ...props }: Props) {
	const { t } = useTranslation()
	const [show, setShow] = useState(false)
	return (
		<div className="relative">
			<input type={show ? "text" : "password"} className={className} {...props} />
			<button
				type="button"
				onClick={() => setShow((v) => !v)}
				aria-label={show ? t("common.hidePassword") : t("common.showPassword")}
				aria-pressed={show}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-subtle) hover:text-(--text-muted) transition-colors"
			>
				{show ? <EyeOff size={16} /> : <Eye size={16} />}
			</button>
		</div>
	)
}
