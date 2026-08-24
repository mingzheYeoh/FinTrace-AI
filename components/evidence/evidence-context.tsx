"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

export interface EvidenceRequest {
  /** Heading for the drawer */
  title: string
  /** Optional sub-heading describing what is being traced */
  subtitle?: string
  factIds: string[]
  calculationIds: string[]
  /** AI narrative shown in a clearly separated section, when relevant */
  narrative?: string
  followUp?: string
}

interface EvidenceContextValue {
  open: boolean
  request: EvidenceRequest | null
  openEvidence: (request: EvidenceRequest) => void
  closeEvidence: () => void
}

const EvidenceContext = createContext<EvidenceContextValue | null>(null)

export function EvidenceProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<EvidenceRequest | null>(null)
  const [open, setOpen] = useState(false)

  const openEvidence = useCallback((next: EvidenceRequest) => {
    setRequest(next)
    setOpen(true)
  }, [])

  const closeEvidence = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ open, request, openEvidence, closeEvidence }), [open, request, openEvidence, closeEvidence])

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>
}

export function useEvidence() {
  const ctx = useContext(EvidenceContext)
  if (!ctx) throw new Error("useEvidence must be used inside an EvidenceProvider")
  return ctx
}
