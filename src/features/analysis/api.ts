import {
  apiClient,
  FinTraceApiError,
  type AnalysisResult,
  type AnalysisStatusResponse,
  type ApiErrorBody,
  type CreateAnalysisResponse,
} from "@/src/lib/api/client"

/**
 * `createAnalysis` — POST /api/v1/analyses
 *
 * Sends one to five real browser File objects as multipart/form-data. No user
 * id, auth token, case id, or persistence instruction is included (Phase 0).
 */
export async function createAnalysis(files: File[]): Promise<CreateAnalysisResponse> {
  const body = new FormData()
  for (const file of files) {
    body.append("files", file, file.name)
  }

  const { data, error, response } = await apiClient.POST("/api/v1/analyses", {
    // openapi-fetch serializes FormData bodies without a JSON content-type.
    body: body as unknown as { files: string[] },
    bodySerializer: (payload: unknown) => payload as FormData,
  })

  if (error || !data) {
    throw new FinTraceApiError(
      response.status,
      error as ApiErrorBody | undefined,
      "The analysis could not be started.",
    )
  }
  return data
}

/** `getAnalysisStatus` — GET /api/v1/analyses/{analysisId}/status */
export async function getAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse> {
  const { data, error, response } = await apiClient.GET("/api/v1/analyses/{analysisId}/status", {
    params: { path: { analysisId } },
  })

  if (error || !data) {
    throw new FinTraceApiError(
      response.status,
      error as ApiErrorBody | undefined,
      "The analysis status could not be retrieved.",
    )
  }
  return data
}

/** `getAnalysisResult` — GET /api/v1/analyses/{analysisId}/result */
export async function getAnalysisResult(analysisId: string): Promise<AnalysisResult> {
  const { data, error, response } = await apiClient.GET("/api/v1/analyses/{analysisId}/result", {
    params: { path: { analysisId } },
  })

  if (error || !data) {
    throw new FinTraceApiError(
      response.status,
      error as ApiErrorBody | undefined,
      "The analysis result could not be retrieved.",
    )
  }
  return data
}
