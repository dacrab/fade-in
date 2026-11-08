import { useRouterState } from "@tanstack/react-router"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { reportError } from "#/lib/reportError"

interface Props {
	fallback: ReactNode
	children: ReactNode
}

interface State {
	hasError: boolean
}

class Boundary extends Component<Props, State> {
	override state: State = { hasError: false }

	static getDerivedStateFromError(): State {
		return { hasError: true }
	}

	override componentDidCatch(error: Error, info: ErrorInfo) {
		reportError(error, { componentStack: info.componentStack ?? undefined })
	}

	override render() {
		return this.state.hasError ? this.props.fallback : this.props.children
	}
}

/**
 * Error boundary for the routed outlet. Keying by pathname resets the boundary
 * on navigation, matching the reset behaviour the app previously got from
 * Sentry's boundary while keeping the Sentry SDK out of the entry graph.
 */
export default function RouteErrorBoundary({ fallback, children }: Props) {
	const pathname = useRouterState({ select: (state) => state.location.pathname })
	return (
		<Boundary key={pathname} fallback={fallback}>
			{children}
		</Boundary>
	)
}
