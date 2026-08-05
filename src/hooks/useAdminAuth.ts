import { useRequireRole } from "#/hooks/useRequireRole"

export function useAdminAuth() {
	return useRequireRole(["admin"])
}
