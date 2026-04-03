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
		],
		links: [
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "stylesheet", href: appCss },
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
			</body>
		</html>
	)
}
