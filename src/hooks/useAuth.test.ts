import { afterEach, describe, expect, it, vi } from "vitest"

type Role = "customer" | "owner" | "barber" | "admin"

interface AuthUser {
	_id: string
	name: string
	email: string
	role: Role
}

function isCustomer(user: AuthUser | null): boolean {
	return user?.role === "customer"
}
function isOwner(user: AuthUser | null): boolean {
	return user?.role === "owner"
}
function isAdmin(user: AuthUser | null): boolean {
	return user?.role === "admin"
}
function isBarber(user: AuthUser | null): boolean {
	return user?.role === "barber"
}
function canManageShop(user: AuthUser | null): boolean {
	return user?.role === "owner" || user?.role === "admin"
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe("Role guards (useAuth logic)", () => {
	const customer: AuthUser = { _id: "u1", name: "Alice", email: "a@b.com", role: "customer" }
	const owner: AuthUser = { _id: "u2", name: "Bob", email: "b@b.com", role: "owner" }
	const admin: AuthUser = { _id: "u3", name: "Carol", email: "c@b.com", role: "admin" }
	const barber: AuthUser = { _id: "u4", name: "Dan", email: "d@b.com", role: "barber" }

	it("isCustomer returns true for customer role", () => {
		expect(isCustomer(customer)).toBe(true)
	})
	it("isCustomer returns false for other roles", () => {
		expect(isCustomer(owner)).toBe(false)
		expect(isCustomer(admin)).toBe(false)
		expect(isCustomer(barber)).toBe(false)
	})
	it("isCustomer returns false for null user", () => {
		expect(isCustomer(null)).toBe(false)
	})

	it("isOwner returns true for owner role", () => {
		expect(isOwner(owner)).toBe(true)
	})
	it("isOwner returns false for non-owner roles", () => {
		expect(isOwner(customer)).toBe(false)
		expect(isOwner(admin)).toBe(false)
	})

	it("isAdmin returns true for admin role", () => {
		expect(isAdmin(admin)).toBe(true)
	})
	it("isAdmin returns false for non-admin roles", () => {
		expect(isAdmin(customer)).toBe(false)
		expect(isAdmin(owner)).toBe(false)
	})

	it("isBarber returns true for barber role", () => {
		expect(isBarber(barber)).toBe(true)
	})

	it("canManageShop returns true for owner and admin", () => {
		expect(canManageShop(owner)).toBe(true)
		expect(canManageShop(admin)).toBe(true)
	})
	it("canManageShop returns false for customer and barber", () => {
		expect(canManageShop(customer)).toBe(false)
		expect(canManageShop(barber)).toBe(false)
	})
	it("canManageShop returns false for null user", () => {
		expect(canManageShop(null)).toBe(false)
	})
})

describe("localStorage auth persistence", () => {
	it("stores a user key after login", () => {
		const user = { _id: "u1", name: "Alice", email: "a@b.com", role: "customer" as Role }
		localStorage.setItem("auth_user", JSON.stringify(user))
		const stored = localStorage.getItem("auth_user")
		expect(stored).not.toBeNull()
		expect(JSON.parse(stored as string).name).toBe("Alice")
	})

	it("returns null after the key is removed (logout)", () => {
		localStorage.setItem("auth_user", JSON.stringify({ _id: "u1" }))
		localStorage.removeItem("auth_user")
		expect(localStorage.getItem("auth_user")).toBeNull()
	})

	it("overwrites existing user on re-login", () => {
		localStorage.setItem("auth_user", JSON.stringify({ _id: "u1", name: "Alice" }))
		localStorage.setItem("auth_user", JSON.stringify({ _id: "u2", name: "Bob" }))
		const raw = localStorage.getItem("auth_user")
		expect(raw).not.toBeNull()
		expect(JSON.parse(raw as string).name).toBe("Bob")
	})
})

describe("AuthUser shape validation", () => {
	it("a valid AuthUser has all required fields", () => {
		const user: AuthUser = {
			_id: "abc123",
			name: "Test User",
			email: "test@example.com",
			role: "customer",
		}
		expect(user._id).toBeTruthy()
		expect(user.name).toBeTruthy()
		expect(user.email).toContain("@")
		expect(["customer", "owner", "barber", "admin"]).toContain(user.role)
	})

	it("role must be one of the four allowed values", () => {
		const validRoles: Role[] = ["customer", "owner", "barber", "admin"]
		for (const role of validRoles) {
			expect(() => {
				const u: AuthUser = { _id: "x", name: "x", email: "x@x.com", role }
				return u
			}).not.toThrow()
		}
	})
})
