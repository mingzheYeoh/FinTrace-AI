"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { UploadPanel, type StagedFile } from "@/components/upload/upload-panel"
import { ProcessingView } from "@/components/processing/processing-view"
import { AnalysisDashboard } from "@/components/dashboard/analysis-dashboard"
import { EvidenceProvider } from "@/components/evidence/evidence-context"
import { EvidenceDrawer } from "@/components/evidence/evidence-drawer"

type Stage = "upload" | "processing" | "dashboard"

export default function Page() {
  const [stage, setStage] = useState<Stage>("upload")
  const [files, setFiles] = useState<StagedFile[]>([])

  return (
    <EvidenceProvider>
      <AppShell>
        {stage === "upload" ? (
          <UploadPanel
            onStart={(staged) => {
              setFiles(staged)
              setStage("processing")
            }}
          />
        ) : null}

        {stage === "processing" ? (
          <ProcessingView
            files={files}
            onComplete={() => setStage("dashboard")}
            onCancel={() => setStage("upload")}
          />
        ) : null}

        {stage === "dashboard" ? (
          <AnalysisDashboard
            onReset={() => {
              setFiles([])
              setStage("upload")
            }}
          />
        ) : null}
      </AppShell>
      <EvidenceDrawer />
    </EvidenceProvider>
  )
}
