"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { UploadPanel, type StagedFile } from "@/components/upload/upload-panel"
import { ProcessingView } from "@/components/processing/processing-view"
import { AnalysisDashboard } from "@/components/dashboard/analysis-dashboard"
import { EvidenceProvider } from "@/components/evidence/evidence-context"
import { EvidenceDrawer } from "@/components/evidence/evidence-drawer"
import { useResetAnalysis } from "@/src/features/analysis/queries"

type Stage = "upload" | "processing" | "dashboard"

export default function Page() {
  const [stage, setStage] = useState<Stage>("upload")
  const [files, setFiles] = useState<StagedFile[]>([])
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const resetAnalysis = useResetAnalysis()

  /** Start over / new analysis: UI-only. Phase 0 has no delete endpoint. */
  const reset = () => {
    resetAnalysis(analysisId)
    setAnalysisId(null)
    setFiles([])
    setStage("upload")
  }

  return (
    <EvidenceProvider analysisId={analysisId}>
      <AppShell>
        {stage === "upload" ? (
          <UploadPanel
            onStarted={(id, staged) => {
              setAnalysisId(id)
              setFiles(staged)
              setStage("processing")
            }}
          />
        ) : null}

        {stage === "processing" && analysisId ? (
          <ProcessingView
            analysisId={analysisId}
            files={files}
            onComplete={() => setStage("dashboard")}
            onCancel={reset}
          />
        ) : null}

        {stage === "dashboard" && analysisId ? (
          <AnalysisDashboard analysisId={analysisId} onReset={reset} />
        ) : null}
      </AppShell>
      <EvidenceDrawer />
    </EvidenceProvider>
  )
}
