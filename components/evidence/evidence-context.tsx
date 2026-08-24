"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

/**
 * Drawer visibility is UI-only state. The evidence payload itself is fetched by
 * `getEvidenceDetail` from the drawer, keyed on the evidence id recorded here.
 */
export interface EvidenceRequest {
  evidenceId: string
  /** Fallback heading shown while the request is in flight. */
  fallbackTitle: string
}

interface EvidenceContextValue {
  open: boolean
  request: EvidenceRequest | null
  analysisId: string | null
  openEvidence: (request: EvidenceRequest) => void
  closeEvidence: () => void
}

const EvidenceContext = createContext<EvidenceContextValue | null>(null)

export function EvidenceProvider({
  analysisId,
  children,
}: {
  analysisId: string | null
  children: React.ReactNode
}) {
  const [request, setRequest] = useState<EvidenceRequest | null>(null)
  const [open, setOpen] = useState(false)

  const openEvidence = useCallback((next: EvidenceRequest) => {
    setRequest(next)
    setOpen(true)
  }, [])

  const closeEvidence = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ open, request, analysisId, openEvidence, closeEvidence }),
    [open, request, analysisId, openEvidence, closeEvidence],
  )

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>
}

export function useEvidence() {
  const ctx = useContext(EvidenceContext)
  if (!ctx) throw new Error("useEvidence must be used inside an EvidenceProvider")
  return ctx
}
