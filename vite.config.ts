import { sentryVitePlugin } from "@sentry/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST)

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		// Skip SSR and devtools plugins in test environment
		...(isTest ? [] : [devtools(), tanstackStart()]),
		tailwindcss(),
		viteReact(),
		...(isTest
			? []
			: [
					sentryVitePlugin({
						org: process.env.SENTRY_ORG,
						project: process.env.SENTRY_PROJECT,
						authToken: process.env.SENTRY_AUTH_TOKEN,
						telemetry: false,
						sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
					}),
				]),
	],
	ssr: {
		external: ["react", "react-dom"],
	},
	build: {
		sourcemap: true,
	},
	test: {
		environment: "node",
		globals: true,
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
	},
})
