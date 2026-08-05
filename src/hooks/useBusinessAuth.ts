import { useRequireRole } from "#/hooks/useRequireRole"

export function useBusinessAuth() {
	return useRequireRole(["owner", "admin"])
}
