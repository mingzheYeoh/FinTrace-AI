import type { Confidence, ValueStatus } from "./types"

export function formatNumber(value: number, fractionDigits = 0) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** Values in the mock set are in thousands; render them as such. */
export function formatCurrency(value: number, currency = "MYR") {
  const sign = value < 0 ? "−" : ""
  return `${sign}${currency} ${formatNumber(Math.abs(value))}k`
}

export function formatPercent(value: number, fractionDigits = 2) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatNumber(Math.abs(value), fractionDigits)}%`
}

export function formatRatio(value: number) {
  return `${formatNumber(value, 2)}x`
}

export function formatMetric(value: number, format: "currency" | "percent" | "ratio", currency = "MYR") {
  if (format === "currency") return formatCurrency(value, currency)
  if (format === "ratio") return formatRatio(value)
  return `${formatNumber(value, 2)}%`
}

/** Percentage change between two periods. Returns null when undefined. */
export function percentChange(current: number | null, prior: number | null) {
  if (current === null || prior === null || prior === 0) return null
  return ((current - prior) / Math.abs(prior)) * 100
}

export function absoluteChange(current: number | null, prior: number | null) {
  if (current === null || prior === null) return null
  return current - prior
}

export const statusMeta: Record<ValueStatus, { label: string; color: string }> = {
  verified: { label: "Verified", color: "green" },
  not_present: { label: "Not present in source", color: "default" },
  not_readable: { label: "Not readable", color: "orange" },
  ambiguous: { label: "Ambiguous", color: "gold" },
  conflicting: { label: "Conflicting sources", color: "volcano" },
  failed: { label: "Extraction failed", color: "red" },
}

export const confidenceMeta: Record<Confidence, { label: string; color: string }> = {
  high: { label: "High confidence", color: "green" },
  medium: { label: "Medium confidence", color: "gold" },
  low: { label: "Low confidence", color: "orange" },
}

export const severityMeta = {
  high: { label: "High", color: "red" },
  medium: { label: "Medium", color: "orange" },
  low: { label: "Low", color: "gold" },
} as const
