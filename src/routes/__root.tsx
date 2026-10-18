import * as Sentry from "@sentry/react"
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
import Footer from "#/components/Footer"
import Header from "#/components/Header"
import { ToastContainer } from "#/components/ui/Toast"
import ConvexProvider from "#/integrations/convex/provider"
import "../i18n"
import appCss from "../styles.css?url"

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
			{ name: "theme-color", content: "#C84B31" },
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
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
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
			<p className="muted-sm max-w-sm">{t("errors.notFoundMessage")}</p>
			<Link to="/" className="btn btn-primary mt-4">
				{t("errors.backHome")}
			</Link>
		</main>
	)
}

function RouteError(_props: ErrorComponentProps) {
	const { t } = useTranslation()
	const router = useRouter()

	return (
		<main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
			<h1 className="text-xl font-bold text-(--text)">{t("errors.errorTitle")}</h1>
			<p className="muted-sm max-w-sm">{t("errors.errorMessage")}</p>
			<button type="button" onClick={() => router.invalidate()} className="btn btn-primary mt-4">
				{t("errors.tryAgain")}
			</button>
		</main>
	)
}

function RootDocument() {
	const { i18n, t } = useTranslation()
	return (
		<html lang={i18n.language === "el" ? "el" : "en"}>
			<head>
				<HeadContent />
			</head>
			<body className="flex flex-col min-h-screen">
				<ConvexProvider>
					<Header />
					<div className="flex-1">
						<Sentry.ErrorBoundary fallback={<p className="p-8 text-center">{t("errors.errorTitle")}</p>}>
							<Outlet />
						</Sentry.ErrorBoundary>
					</div>
					<Footer />
					<ToastContainer />
				</ConvexProvider>
				<Scripts />
			</body>
		</html>
	)
}
