"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FinTraceApiError,
  isNonRetryableStatus,
  retryUnlessContractError,
  type AnalysisLifecycleStatus,
  type AnalysisStatusResponse,
} from "@/src/lib/api/client"
import { queryKeys } from "@/src/lib/api/query-keys"
import { createAnalysis, getAnalysisResult, getAnalysisStatus } from "./api"

const POLL_INTERVAL_MS = 900

/** Lifecycle values that end polling, per FRONTEND-API-MAP polling rules. */
export function isTerminalStatus(status: AnalysisLifecycleStatus | undefined): boolean {
  return status === "completed" || status === "failed"
}

/** `createAnalysis` mutation. Never retried: 413/415/422 are user-correctable. */
export function useCreateAnalysis() {
  return useMutation({
    mutationKey: queryKeys.createAnalysis(),
    mutationFn: (files: File[]) => createAnalysis(files),
    retry: false,
  })
}

/**
 * Polls `getAnalysisStatus` until the lifecycle reaches `completed` or `failed`.
 * The six stages come from the response; no component timer reproduces them.
 */
export function useAnalysisStatus(analysisId: string | null) {
  return useQuery({
    queryKey: queryKeys.analysisStatus(analysisId ?? "none"),
    queryFn: () => getAnalysisStatus(analysisId as string),
    enabled: Boolean(analysisId),
    refetchInterval: (query) => {
      const data = query.state.data as AnalysisStatusResponse | undefined
      if (isTerminalStatus(data?.status)) return false
      // A contract 404 is terminal; stop polling a nonexistent analysis.
      const error = query.state.error
      if (error instanceof FinTraceApiError && isNonRetryableStatus(error.status)) return false
      return POLL_INTERVAL_MS
    },
    refetchOnWindowFocus: false,
    retry: retryUnlessContractError,
    gcTime: 0,
  })
}

/**
 * Fetches the dashboard payload. Gated on terminal completion so the contract
 * rule "do not fetch result before terminal completion" holds. A 409
 * result-not-ready response is surfaced without discarding processing state.
 */
export function useAnalysisResult(analysisId: string | null, ready: boolean) {
  return useQuery({
    queryKey: queryKeys.analysisResult(analysisId ?? "none"),
    queryFn: () => getAnalysisResult(analysisId as string),
    enabled: Boolean(analysisId) && ready,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    retry: retryUnlessContractError,
  })
}

/**
 * Clears every query for one analysis. Backs "start over" / "new analysis",
 * which are UI-only actions: Phase 0 has no delete endpoint.
 */
export function useResetAnalysis() {
  const queryClient = useQueryClient()
  return (analysisId: string | null) => {
    if (analysisId) {
      queryClient.removeQueries({ queryKey: queryKeys.analysisRoot(analysisId) })
    }
    queryClient.removeQueries({ queryKey: ["analysis"] })
  }
}
