import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

let router: ReturnType<typeof createTanStackRouter>

export function createRouter() {
	router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
	})
	return router
}

export function getRouter() {
	return router
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>
	}
}
