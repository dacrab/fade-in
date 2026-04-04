import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router"
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
			{ name: "theme-color", content: "#f59e0b" },
			{ name: "mobile-web-app-capable", content: "yes" },
			{ name: "apple-mobile-web-app-capable", content: "yes" },
			{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
			{ name: "apple-mobile-web-app-title", content: "FadeIn" },
		],
		links: [
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "apple-touch-icon", href: "/favicon.svg" },
		],
	}),
	component: RootDocument,
})

function RootDocument() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ConvexProvider>
					<Header />
					<Outlet />
					<Footer />
					<ToastContainer />
				</ConvexProvider>
				<Scripts />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: SW registration
					dangerouslySetInnerHTML={{
						__html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')); }`,
					}}
				/>
			</body>
		</html>
	)
}
