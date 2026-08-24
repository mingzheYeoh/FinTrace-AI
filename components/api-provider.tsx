"use client"

import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Flex, Spin } from "antd"

/**
 * One stable QueryClient plus MSW startup. Children render only after the
 * worker is listening, so the first API call cannot escape interception.
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

  const [mocksReady, setMocksReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    import("@/src/mocks/browser")
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => {
        if (!cancelled) setMocksReady(true)
      })
      .catch((error) => {
        console.log("[v0] MSW failed to start:", error)
        // Surface the app anyway; requests will fail locally rather than
        // silently reaching an unintended endpoint.
        if (!cancelled) setMocksReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!mocksReady) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100dvh" }}>
        <Spin size="large" aria-label="Starting FinTrace AI" />
      </Flex>
    )
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
