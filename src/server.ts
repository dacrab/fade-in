import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server"
import { createServerEntry } from "@tanstack/react-start/server-entry"
import { initServerSentry } from "#/sentry.server"

initServerSentry()

const fetch = createStartHandler(defaultStreamHandler)

export default createServerEntry({ fetch })
