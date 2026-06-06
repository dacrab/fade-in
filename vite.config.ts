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
	],
	ssr: {
		external: ["react", "react-dom"],
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
	},
})
