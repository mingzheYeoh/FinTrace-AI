/**
 * Deterministic synthetic demo files.
 *
 * These are real browser `File` objects so `createAnalysis` can build a genuine
 * multipart body. The MSW handler never parses their contents — the fixture
 * supplies the analysis output — so the payload is a short synthetic marker
 * rather than a fake financial document.
 */
export interface DemoFileSpec {
  name: string
  kind: "pdf" | "xlsx" | "csv"
  mimeType: string
  sizeLabel: string
  byteLength: number
}

export const DEMO_FILE_SPECS: DemoFileSpec[] = [
  {
    name: "northwind-annual-report-2025.pdf",
    kind: "pdf",
    mimeType: "application/pdf",
    sizeLabel: "2.4 MB",
    byteLength: 2_517_000,
  },
  {
    name: "northwind-trial-balance-2025.xlsx",
    kind: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeLabel: "184 KB",
    byteLength: 188_416,
  },
]

/**
 * Builds the demo set. Files are padded to their declared byte length so the
 * queue shows realistic sizes and the 20 MB rule is exercised against real
 * `File.size` values rather than a hardcoded label.
 */
export function createDemoFiles(): File[] {
  return DEMO_FILE_SPECS.map((spec) => {
    const header = `FinTrace AI synthetic demo file: ${spec.name}\n`
    const padding = new Uint8Array(Math.max(0, spec.byteLength - header.length))
    return new File([header, padding], spec.name, { type: spec.mimeType })
  })
}
