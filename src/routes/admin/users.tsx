import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Users } from "lucide-react"
import { Skeleton } from "../../components/ui/Skeleton"
import type { User, UserRole } from "../../types"

export const Route = createFileRoute("/admin/users")({ component: AdminUsers })

const ROLE_BADGE: Record<UserRole, string> = {
	customer: "badge-gray",
	owner: "badge-gold",
	barber: "badge-green",
	admin: "badge-red",
}

function AdminUsers() {
	const allUsersRaw = useQuery(api.users.listAll)
	const allUsers = allUsersRaw as User[] | undefined

	return (
		<main className="px-4 py-8">
			<div className="page-wrap max-w-4xl">
				<div className="flex items-center gap-3 mb-6">
					<Link
						to="/admin"
						className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] no-underline"
					>
						← Admin
					</Link>
					<span className="text-[var(--border)]">/</span>
					<h1 className="text-2xl font-bold text-[var(--text)]">Manage Users</h1>
				</div>

				{allUsers === undefined ? (
					<div className="space-y-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="h-14 w-full rounded-xl" />
						))}
					</div>
				) : allUsers.length === 0 ? (
					<div className="text-center py-16 text-[var(--text-muted)]">
						<Users size={36} className="mx-auto mb-3 opacity-30" />
						<p>No users registered yet.</p>
					</div>
				) : (
					<div className="card overflow-hidden">
						<div className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
							<span>Name</span>
							<span>Email</span>
							<span>Role</span>
						</div>
						{allUsers.map((u, i) => (
							<div
								key={u._id}
								className={`grid grid-cols-3 gap-4 px-4 py-3 items-center ${i < allUsers.length - 1 ? "border-b border-[var(--border)]" : ""}`}
							>
								<div className="flex items-center gap-2 min-w-0">
									<div
										className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
										style={{ background: "var(--gold)", color: "#000" }}
									>
										{u.name.charAt(0).toUpperCase()}
									</div>
									<span className="text-sm text-[var(--text)] truncate">{u.name}</span>
								</div>
								<span className="text-sm text-[var(--text-muted)] truncate">{u.email}</span>
								<span className={`badge ${ROLE_BADGE[u.role]} w-fit`}>{u.role}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	)
}
