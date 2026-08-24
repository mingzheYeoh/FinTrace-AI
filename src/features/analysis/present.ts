import type { MetricFormat } from "@/src/lib/api/client"

/**
 * Small presentation adapter.
 *
 * The API and fixture carry decimal strings so no precision is lost in
 * transport; they remain the source of truth. Ant charts and the number
 * formatters need JS numbers, so conversion happens here — once, at the
 * presentation boundary — rather than inside each component.
 */
export function toNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Converts a contract MetricFormat to the formatter's format argument. */
export function toFormatKind(format: MetricFormat): "currency" | "percent" | "ratio" {
  if (format === "percentage") return "percent"
  if (format === "ratio") return "ratio"
  return "currency"
}
