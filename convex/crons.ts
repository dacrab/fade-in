import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.hourly(
	"sweep stale pending appointments",
	{ minuteUTC: 30 },
	internal.appointments.sweepStalePending,
	{},
)

export default crons
