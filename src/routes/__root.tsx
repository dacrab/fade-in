import * as Sentry from "@sentry/react"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router"
import { useMemo } from "react"
import { I18nextProvider, useTranslation } from "react-i18next"
import Footer from "#/components/Footer"
import Header from "#/components/Header"
import { ToastContainer } from "#/components/ui/Toast"
import { createI18n, isLanguage, resolveLanguage } from "#/i18n"
import ConvexProvider from "#/integrations/convex/provider"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
	loader: () => ({ language: resolveLanguage() }),
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
			{ name: "theme-color", content: "#F7F4EE" },
		],
		links: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
			{
				rel: "stylesheet",
				href:
					"https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=Fraunces:opsz,wght@9..144,400..700&display=swap",
			},
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "stylesheet", href: appCss },
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
			<span className="font-serif text-7xl font-medium italic leading-none text-(--gold)/30">404</span>
			<h1 className="display text-[2.1rem] text-(--text)">{t("errors.notFoundTitle")}</h1>
			<p className="muted-sm max-w-sm">{t("errors.notFoundMessage")}</p>
			<Link to="/" className="btn btn-primary mt-4">
				{t("errors.backHome")}
			</Link>
		</main>
	)
}

function RouteError({ reset }: ErrorComponentProps) {
	const { t } = useTranslation()

	return (
		<main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
			<h1 className="display text-[2rem] text-(--text)">{t("errors.errorTitle")}</h1>
			<p className="muted-sm max-w-sm">{t("errors.errorMessage")}</p>
			<button type="button" onClick={reset} className="btn btn-primary mt-4">
				{t("errors.tryAgain")}
			</button>
		</main>
	)
}

function RootDocument() {
	const { language } = Route.useLoaderData()
	const i18n = useMemo(() => createI18n(language), [language])

	return (
		<I18nextProvider i18n={i18n}>
			<RootHtml />
		</I18nextProvider>
	)
}

function RootHtml() {
	const { i18n, t } = useTranslation()
	const language = isLanguage(i18n.language) ? i18n.language : "en"

	return (
		<html lang={language}>
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
