/**
 * Cache keys exactly as specified in FRONTEND-API-MAP section 4.
 *
 *   mutation: ["analysis", "create"]
 *   query:    ["analysis", analysisId, "status"]
 *   query:    ["analysis", analysisId, "result"]
 *   query:    ["analysis", analysisId, "evidence", evidenceId]
 */
export const queryKeys = {
  createAnalysis: () => ["analysis", "create"] as const,
  analysisRoot: (analysisId: string) => ["analysis", analysisId] as const,
  analysisStatus: (analysisId: string) => ["analysis", analysisId, "status"] as const,
  analysisResult: (analysisId: string) => ["analysis", analysisId, "result"] as const,
  evidenceDetail: (analysisId: string, evidenceId: string) =>
    ["analysis", analysisId, "evidence", evidenceId] as const,
}
