import { describe, expect, it } from "vitest"
import { generateManageToken, verifyManageToken } from "./token"

const SECRET = "test-secret-123"

describe("manage token", () => {
	it("generates a 32-char hex token", async () => {
		const token = await generateManageToken("appt-1", "a@b.com", SECRET)
		expect(token).toHaveLength(32)
		expect(token).toMatch(/^[0-9a-f]{32}$/)
	})

	it("verifies a token generated from the same inputs", async () => {
		const token = await generateManageToken("appt-1", "a@b.com", SECRET)
		await expect(verifyManageToken(token, "appt-1", "a@b.com", SECRET)).resolves.toBe(true)
	})

	it("rejects a token for different appointment ID", async () => {
		const token = await generateManageToken("appt-1", "a@b.com", SECRET)
		await expect(verifyManageToken(token, "appt-2", "a@b.com", SECRET)).resolves.toBe(false)
	})

	it("rejects a token for different email", async () => {
		const token = await generateManageToken("appt-1", "a@b.com", SECRET)
		await expect(verifyManageToken(token, "appt-1", "b@b.com", SECRET)).resolves.toBe(false)
	})

	it("rejects a token from a different secret", async () => {
		const token = await generateManageToken("appt-1", "a@b.com", SECRET)
		await expect(verifyManageToken(token, "appt-1", "a@b.com", "other-secret")).resolves.toBe(false)
	})

	it("rejects an empty token", async () => {
		await expect(verifyManageToken("", "appt-1", "a@b.com", SECRET)).resolves.toBe(false)
	})
})
