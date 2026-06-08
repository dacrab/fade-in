import type { ErrorComponentProps } from "@tanstack/react-router"
import {
	createRootRoute,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useRouter,
} from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import * as Sentry from "@sentry/react"
import Footer from "#/components/Footer"
import Header from "#/components/Header"
import { ToastContainer } from "#/components/ui/Toast"
import ConvexProvider from "#/integrations/convex/provider"
import { initClientSentry } from "#/sentry.client"
import "../i18n"
import appCss from "../styles.css?url"

// Initialize client-side Sentry
if (typeof window !== "undefined") {
	initClientSentry()
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "FadeIn — Book Your Barbershop" },
			{
				name: "description",
				content:
					"Discover and book top barbershops near you. FadeIn is the modern platform for premium grooming experiences.",
			},
			{ name: "theme-color", content: "var(--gold)" },
			{ name: "mobile-web-app-capable", content: "yes" },
			{ name: "apple-mobile-web-app-capable", content: "yes" },
			{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
			{ name: "apple-mobile-web-app-title", content: "FadeIn" },
		],
		links: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
			{
				rel: "stylesheet",
				href:
					"https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap",
			},
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "apple-touch-icon", href: "/favicon.svg" },
		],
	}),
	component: RootDocument,
	notFoundComponent: NotFound,
	errorComponent: RouteError,
})

function NotFound() {
	const { t } = useTranslation()
	return (
		<main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
			<h1 className="text-6xl font-bold text-(--border)">404</h1>
			<p className="text-lg font-semibold text-(--text)">{t("errors.notFoundTitle")}</p>
			<p className="text-sm text-(--text-muted) max-w-sm">{t("errors.notFoundMessage")}</p>
			<Link to="/" className="btn btn-primary mt-4">
				{t("errors.backHome")}
			</Link>
		</main>
	)
}

function RouteError({ error }: ErrorComponentProps) {
	const { t } = useTranslation()
	const router = useRouter()

	return (
		<main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
			<h1 className="text-xl font-bold text-(--text)">{t("errors.errorTitle")}</h1>
			<p className="text-sm text-(--text-muted) max-w-sm">
				{error instanceof Error ? error.message : t("errors.errorMessage")}
			</p>
			<button type="button" onClick={() => router.invalidate()} className="btn btn-primary mt-4">
				{t("errors.tryAgain")}
			</button>
		</main>
	)
}

function RootDocument() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="flex flex-col min-h-screen">
				<ConvexProvider>
					<Header />
					<div className="flex-1">
						<Sentry.ErrorBoundary fallback={<div>Something went wrong</div>}>
							<Outlet />
						</Sentry.ErrorBoundary>
					</div>
					<Footer />
					<ToastContainer />
				</ConvexProvider>
				<Scripts />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: SW registration inline script
					dangerouslySetInnerHTML={{
						__html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')); }`,
					}}
				/>
			</body>
		</html>
	)
}
