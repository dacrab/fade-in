import { Link } from "@tanstack/react-router"
import { Scissors } from "lucide-react"

export default function Logo() {
	return (
		<Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
			<div className="gold-gradient flex items-center justify-center w-8 h-8 rounded-lg">
				<Scissors size={16} className="text-black" />
			</div>
			<span className="font-bold text-lg tracking-tight text-[var(--text)]">
				Fade<span className="gold-text">In</span>
			</span>
		</Link>
	)
}
