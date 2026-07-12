import { ConvexError } from "convex/values"
import type { Doc, Id } from "../_generated/dataModel"

type ServiceGetter = (id: Id<"services">) => Promise<Doc<"services"> | null>

/**
 * Computes the total price (in cents) for a set of services, validating that
 * every service is active and belongs to the given barbershop. Shared by the
 * booking mutation and the checkout action so pricing stays consistent.
 *
 * Accepts a `getService` accessor because actions can't read the database
 * directly and must go through `runQuery`.
 */
export async function computeServiceTotal(
	getService: ServiceGetter,
	serviceIds: Id<"services">[],
	barbershopId: Id<"barbershops">,
): Promise<number> {
	const services = await Promise.all(serviceIds.map((id) => getService(id)))
	return services.reduce((sum, s) => {
		if (!s?.isActive) throw new ConvexError("Invalid service")
		if (s.barbershopId !== barbershopId) throw new ConvexError("Service not from this shop")
		return sum + s.price
	}, 0)
}
