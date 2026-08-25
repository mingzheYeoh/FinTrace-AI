"use client"

import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Flex, Spin } from "antd"
import { resolveApiMode, shouldStartMocks } from "@/src/lib/api/mode.mjs"

const apiMode = resolveApiMode()

/**
 * One stable QueryClient plus mode-aware startup. In mock mode, children
 * render only after MSW is listening so the first request cannot escape.
 */
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            // Retry policy is set per-query from the contract error map.
            retry: false,
          },
        },
      }),
  )

  const [apiReady, setApiReady] = useState(!shouldStartMocks(apiMode))

  useEffect(() => {
    if (!shouldStartMocks(apiMode)) return

    let cancelled = false
    import("@/src/mocks/browser")
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => {
        if (!cancelled) setApiReady(true)
      })
      .catch((error) => {
        console.log("[FinTrace] MSW failed to start:", error)
        // Surface the app anyway; requests will fail locally rather than
        // silently reaching an unintended endpoint.
        if (!cancelled) setApiReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!apiReady) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100dvh" }}>
        <Spin size="large" aria-label="Starting FinTrace AI" />
      </Flex>
    )
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
