import { setupWorker } from "msw/browser"
import { handlers } from "./handlers"

export const worker = setupWorker(...handlers)

let startPromise: Promise<unknown> | null = null

/**
 * Starts the service worker once per page load. Callers await this before any
 * API-driven screen issues a request, so no call escapes interception.
 *
 * Unhandled requests are logged, not proxied: if MSW is unavailable the request
 * fails locally rather than reaching a third-party endpoint.
 */
export function startMockWorker(): Promise<unknown> {
  if (!startPromise) {
    startPromise = worker.start({
      onUnhandledRequest: "bypass",
      quiet: true,
      serviceWorker: { url: "/mockServiceWorker.js" },
    })
  }
  return startPromise
}
