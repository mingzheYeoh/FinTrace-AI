"use client"

import { useQuery } from "@tanstack/react-query"
import { retryUnlessContractError } from "@/src/lib/api/client"
import { queryKeys } from "@/src/lib/api/query-keys"
import { getEvidenceDetail } from "./api"

/**
 * Loads one evidence binding. Cached per analysis + evidence id so reopening
 * the same trail is instant. A 404 is terminal; transport/5xx gets one retry.
 */
export function useEvidenceDetail(analysisId: string | null, evidenceId: string | null) {
  return useQuery({
    queryKey: queryKeys.evidenceDetail(analysisId ?? "none", evidenceId ?? "none"),
    queryFn: () => getEvidenceDetail(analysisId as string, evidenceId as string),
    enabled: Boolean(analysisId) && Boolean(evidenceId),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    retry: retryUnlessContractError,
  })
}
