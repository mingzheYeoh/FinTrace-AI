import { apiClient, FinTraceApiError, type ApiErrorBody, type EvidenceDetail } from "@/src/lib/api/client"

/**
 * `getEvidenceDetail` — GET /api/v1/analyses/{analysisId}/evidence/{evidenceId}
 *
 * Returns the fact and calculation ids bound to a clicked UI item. The drawer
 * resolves those ids against the cached analysis result.
 */
export async function getEvidenceDetail(analysisId: string, evidenceId: string): Promise<EvidenceDetail> {
  const { data, error, response } = await apiClient.GET(
    "/api/v1/analyses/{analysisId}/evidence/{evidenceId}",
    { params: { path: { analysisId, evidenceId } } },
  )

  if (error || !data) {
    throw new FinTraceApiError(
      response.status,
      error as ApiErrorBody | undefined,
      "The evidence trail could not be retrieved.",
    )
  }
  return data
}
