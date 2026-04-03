import { Link } from "@tanstack/react-router"

interface Props {
	to: string
	label: string
	title: string
}

/** Renders a breadcrumb navigation row: ← Parent / Title */
export default function Breadcrumb({ to, label, title }: Props) {
	return (
		<div className="page-header">
			<Link to={to} className="breadcrumb-back">
				← {label}
			</Link>
			<span className="breadcrumb-sep">/</span>
			<h1>{title}</h1>
		</div>
	)
}
