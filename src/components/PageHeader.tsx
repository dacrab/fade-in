import { Link } from "@tanstack/react-router"

interface Props {
	back: string
	backLabel: string
	title: string
	children?: React.ReactNode
}

export default function PageHeader({ back, backLabel, title, children }: Props) {
	return (
		<div className="flex items-center justify-between mb-6">
			<div className="page-header">
				<Link to={back} className="breadcrumb-back">
					← {backLabel}
				</Link>
				<span className="breadcrumb-sep">/</span>
				<h1>{title}</h1>
			</div>
			{children}
		</div>
	)
}
