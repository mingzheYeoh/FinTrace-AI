import type {
  Anomaly,
  Calculation,
  CaseSummary,
  FinancialFact,
  Insight,
  KpiMetric,
  ProcessingStage,
  TrendPoint,
} from "./types"

// ---------------------------------------------------------------------------
// SYNTHETIC DEMONSTRATION DATA ONLY.
// Per PRD s.18 no real, confidential or licensed financial data is used.
// ---------------------------------------------------------------------------

export const CURRENT_PERIOD = "FY2025"
export const PRIOR_PERIOD = "FY2024"

export const caseSummary: CaseSummary = {
  id: "CASE-2041",
  company: "Northwind Components Bhd (synthetic)",
  registrationId: "SYN-1998-0043221",
  currency: "MYR",
  unitScale: "thousands",
  currentPeriod: CURRENT_PERIOD,
  priorPeriod: PRIOR_PERIOD,
  statementDate: "31 Dec 2025",
  documents: [
    { id: "doc-1", name: "northwind-annual-report-2025.pdf", sizeLabel: "3.4 MB", kind: "pdf", pageOrSheetCount: 68 },
    { id: "doc-2", name: "northwind-trial-balance-2025.xlsx", sizeLabel: "612 KB", kind: "xlsx", pageOrSheetCount: 7 },
  ],
  fieldsExtracted: 17,
  fieldsTargeted: 19,
  manualReviewCount: 2,
}

const pdf = "northwind-annual-report-2025.pdf"
const xlsx = "northwind-trial-balance-2025.xlsx"

function fact(
  id: string,
  label: string,
  field: string,
  period: string,
  value: number | null,
  opts: Partial<FinancialFact> = {},
): FinancialFact {
  return {
    id,
    label,
    field,
    period,
    value,
    currency: "MYR",
    unitScale: "thousands",
    status: "verified",
    confidence: "high",
    evidence: [],
    ...opts,
  }
}

export const facts: FinancialFact[] = [
  fact("f-rev-cur", "Revenue", "revenue", CURRENT_PERIOD, 148_200, {
    evidence: [
      {
        document: pdf,
        locator: "Page 34 · Statement of Profit or Loss · Row 1",
        rawValue: "148,200",
        excerpt: "Revenue 148,200 132,450",
        extractedAt: "2026-08-24T09:12:04Z",
      },
    ],
  }),
  fact("f-rev-pri", "Revenue", "revenue", PRIOR_PERIOD, 132_450, {
    evidence: [
      {
        document: pdf,
        locator: "Page 34 · Statement of Profit or Loss · Row 1",
        rawValue: "132,450",
        excerpt: "Revenue 148,200 132,450",
        extractedAt: "2026-08-24T09:12:04Z",
      },
    ],
  }),
  fact("f-gp-cur", "Gross profit", "gross_profit", CURRENT_PERIOD, 31_122, {
    evidence: [
      {
        document: pdf,
        locator: "Page 34 · Statement of Profit or Loss · Row 4",
        rawValue: "31,122",
        excerpt: "Gross profit 31,122 30,463",
        extractedAt: "2026-08-24T09:12:05Z",
      },
    ],
  }),
  fact("f-gp-pri", "Gross profit", "gross_profit", PRIOR_PERIOD, 30_463, {
    evidence: [
      {
        document: pdf,
        locator: "Page 34 · Statement of Profit or Loss · Row 4",
        rawValue: "30,463",
        excerpt: "Gross profit 31,122 30,463",
        extractedAt: "2026-08-24T09:12:05Z",
      },
    ],
  }),
  fact("f-op-cur", "Operating profit", "operating_profit", CURRENT_PERIOD, 9_640, {
    evidence: [
      {
        document: pdf,
        locator: "Page 34 · Statement of Profit or Loss · Row 9",
        rawValue: "9,640",
        excerpt: "Operating profit 9,640 11,880",
        extractedAt: "2026-08-24T09:12:05Z",
      },
    ],
  }),
  fact("f-op-pri", "Operating profit", "operating_profit", PRIOR_PERIOD, 11_880, {
    evidence: [
      {
        document: pdf,
        locator: "Page 34 · Statement of Profit or Loss · Row 9",
        rawValue: "11,880",
        excerpt: "Operating profit 9,640 11,880",
        extractedAt: "2026-08-24T09:12:05Z",
      },
    ],
  }),
  fact("f-np-cur", "Net profit", "net_profit", CURRENT_PERIOD, 5_180, {
    evidence: [
      {
        document: pdf,
        locator: "Page 35 · Statement of Profit or Loss · Row 14",
        rawValue: "5,180",
        excerpt: "Profit for the financial year 5,180 8,240",
        extractedAt: "2026-08-24T09:12:06Z",
      },
      {
        document: xlsx,
        locator: "Sheet 'P&L Summary' · Cell D22",
        rawValue: "5180",
        excerpt: "Net profit after tax | 5180",
        extractedAt: "2026-08-24T09:12:11Z",
      },
    ],
  }),
  fact("f-np-pri", "Net profit", "net_profit", PRIOR_PERIOD, 8_240, {
    evidence: [
      {
        document: pdf,
        locator: "Page 35 · Statement of Profit or Loss · Row 14",
        rawValue: "8,240",
        excerpt: "Profit for the financial year 5,180 8,240",
        extractedAt: "2026-08-24T09:12:06Z",
      },
    ],
  }),
  fact("f-ocf-cur", "Operating cash flow", "operating_cash_flow", CURRENT_PERIOD, -2_310, {
    evidence: [
      {
        document: pdf,
        locator: "Page 41 · Statement of Cash Flows · Row 12",
        rawValue: "(2,310)",
        excerpt: "Net cash from operating activities (2,310) 7,905",
        extractedAt: "2026-08-24T09:12:08Z",
      },
    ],
    note: "Parenthesised source value normalized to a negative figure.",
  }),
  fact("f-ocf-pri", "Operating cash flow", "operating_cash_flow", PRIOR_PERIOD, 7_905, {
    evidence: [
      {
        document: pdf,
        locator: "Page 41 · Statement of Cash Flows · Row 12",
        rawValue: "7,905",
        excerpt: "Net cash from operating activities (2,310) 7,905",
        extractedAt: "2026-08-24T09:12:08Z",
      },
    ],
  }),
  fact("f-ca-cur", "Current assets", "current_assets", CURRENT_PERIOD, 62_400, {
    evidence: [
      {
        document: pdf,
        locator: "Page 37 · Statement of Financial Position · Row 8",
        rawValue: "62,400",
        excerpt: "Total current assets 62,400 58,120",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-ca-pri", "Current assets", "current_assets", PRIOR_PERIOD, 58_120, {
    evidence: [
      {
        document: pdf,
        locator: "Page 37 · Statement of Financial Position · Row 8",
        rawValue: "58,120",
        excerpt: "Total current assets 62,400 58,120",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-cl-cur", "Current liabilities", "current_liabilities", CURRENT_PERIOD, 66_950, {
    evidence: [
      {
        document: pdf,
        locator: "Page 38 · Statement of Financial Position · Row 6",
        rawValue: "66,950",
        excerpt: "Total current liabilities 66,950 49,300",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-cl-pri", "Current liabilities", "current_liabilities", PRIOR_PERIOD, 49_300, {
    evidence: [
      {
        document: pdf,
        locator: "Page 38 · Statement of Financial Position · Row 6",
        rawValue: "49,300",
        excerpt: "Total current liabilities 66,950 49,300",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-ta-cur", "Total assets", "total_assets", CURRENT_PERIOD, 141_800, {
    evidence: [
      {
        document: pdf,
        locator: "Page 37 · Statement of Financial Position · Row 14",
        rawValue: "141,800",
        excerpt: "Total assets 141,800 128,640",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-ta-pri", "Total assets", "total_assets", PRIOR_PERIOD, 128_640, {
    evidence: [
      {
        document: pdf,
        locator: "Page 37 · Statement of Financial Position · Row 14",
        rawValue: "128,640",
        excerpt: "Total assets 141,800 128,640",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-eq-cur", "Shareholders' equity", "shareholders_equity", CURRENT_PERIOD, 48_210, {
    evidence: [
      {
        document: pdf,
        locator: "Page 38 · Statement of Financial Position · Row 20",
        rawValue: "48,210",
        excerpt: "Total equity 48,210 46,880",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-eq-pri", "Shareholders' equity", "shareholders_equity", PRIOR_PERIOD, 46_880, {
    evidence: [
      {
        document: pdf,
        locator: "Page 38 · Statement of Financial Position · Row 20",
        rawValue: "46,880",
        excerpt: "Total equity 48,210 46,880",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-debt-cur", "Borrowings", "borrowings", CURRENT_PERIOD, 54_600, {
    evidence: [
      {
        document: pdf,
        locator: "Page 39 · Note 18 Borrowings · Table 2",
        rawValue: "54,600",
        excerpt: "Total borrowings 54,600 38,150",
        extractedAt: "2026-08-24T09:12:09Z",
      },
    ],
  }),
  fact("f-debt-pri", "Borrowings", "borrowings", PRIOR_PERIOD, 38_150, {
    evidence: [
      {
        document: pdf,
        locator: "Page 39 · Note 18 Borrowings · Table 2",
        rawValue: "38,150",
        excerpt: "Total borrowings 54,600 38,150",
        extractedAt: "2026-08-24T09:12:09Z",
      },
    ],
  }),
  // Conflicting value across two documents — must never be silently repaired.
  fact("f-recv-cur", "Trade receivables", "trade_receivables", CURRENT_PERIOD, 41_900, {
    status: "conflicting",
    confidence: "medium",
    evidence: [
      {
        document: pdf,
        locator: "Page 37 · Statement of Financial Position · Row 4",
        rawValue: "41,900",
        excerpt: "Trade and other receivables 41,900 29,600",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
    conflictWith: {
      value: 40_150,
      evidence: {
        document: xlsx,
        locator: "Sheet 'Balances' · Cell F17",
        rawValue: "40150",
        excerpt: "Trade receivables (net of provision) | 40150",
        extractedAt: "2026-08-24T09:12:12Z",
      },
    },
    note: "Two sources disagree by 1,750 thousand. Both values retained; comparison flagged for manual review.",
  }),
  fact("f-recv-pri", "Trade receivables", "trade_receivables", PRIOR_PERIOD, 29_600, {
    evidence: [
      {
        document: pdf,
        locator: "Page 37 · Statement of Financial Position · Row 4",
        rawValue: "29,600",
        excerpt: "Trade and other receivables 41,900 29,600",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-cash-cur", "Cash and cash equivalents", "cash", CURRENT_PERIOD, 4_820, {
    evidence: [
      {
        document: pdf,
        locator: "Page 37 · Statement of Financial Position · Row 7",
        rawValue: "4,820",
        excerpt: "Cash and bank balances 4,820 11,240",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-cash-pri", "Cash and cash equivalents", "cash", PRIOR_PERIOD, 11_240, {
    evidence: [
      {
        document: pdf,
        locator: "Page 37 · Statement of Financial Position · Row 7",
        rawValue: "11,240",
        excerpt: "Cash and bank balances 4,820 11,240",
        extractedAt: "2026-08-24T09:12:07Z",
      },
    ],
  }),
  fact("f-inv-cur", "Inventory", "inventory", CURRENT_PERIOD, 14_310, {
    confidence: "medium",
    evidence: [
      {
        document: xlsx,
        locator: "Sheet 'Balances' · Cell F21",
        rawValue: "14310",
        excerpt: "Inventories at cost | 14310",
        extractedAt: "2026-08-24T09:12:12Z",
      },
    ],
  }),
  fact("f-inv-pri", "Inventory", "inventory", PRIOR_PERIOD, 12_040, {
    confidence: "medium",
    evidence: [
      {
        document: xlsx,
        locator: "Sheet 'Balances' · Cell E21",
        rawValue: "12040",
        excerpt: "Inventories at cost | 12040",
        extractedAt: "2026-08-24T09:12:12Z",
      },
    ],
  }),
  // Deliberately unavailable fields — the PRD forbids substituting a number.
  fact("f-payables-cur", "Trade payables", "trade_payables", CURRENT_PERIOD, null, {
    status: "not_readable",
    confidence: "low",
    evidence: [
      {
        document: pdf,
        locator: "Page 40 · Note 21 · Table 1",
        rawValue: "—",
        excerpt: "Trade payables ▮▮,▮▮▮ (scanned region, low OCR confidence)",
        extractedAt: "2026-08-24T09:12:10Z",
      },
    ],
    note: "Scanned table region returned low OCR confidence. Manual review required; no value substituted.",
  }),
  fact("f-pbt-cur", "Profit before tax", "profit_before_tax", CURRENT_PERIOD, null, {
    status: "not_present",
    confidence: "high",
    evidence: [],
    note: "Not disclosed as a separate line in this source document. Absence is not an extraction failure.",
  }),
]

export const calculations: Calculation[] = [
  {
    id: "c-rev-change",
    label: "Revenue change",
    formula: "(Revenue FY2025 − Revenue FY2024) / Revenue FY2024 × 100",
    inputs: ["f-rev-cur", "f-rev-pri"],
    substitution: "(148,200 − 132,450) / 132,450 × 100",
    result: 11.89,
    unit: "%",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-np-change",
    label: "Net profit change",
    formula: "(Net profit FY2025 − Net profit FY2024) / Net profit FY2024 × 100",
    inputs: ["f-np-cur", "f-np-pri"],
    substitution: "(5,180 − 8,240) / 8,240 × 100",
    result: -37.14,
    unit: "%",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-gpm-cur",
    label: "Gross profit margin",
    formula: "Gross profit / Revenue × 100",
    inputs: ["f-gp-cur", "f-rev-cur"],
    substitution: "31,122 / 148,200 × 100",
    result: 21.0,
    unit: "%",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-gpm-pri",
    label: "Gross profit margin",
    formula: "Gross profit / Revenue × 100",
    inputs: ["f-gp-pri", "f-rev-pri"],
    substitution: "30,463 / 132,450 × 100",
    result: 23.0,
    unit: "%",
    period: PRIOR_PERIOD,
  },
  {
    id: "c-opm-cur",
    label: "Operating margin",
    formula: "Operating profit / Revenue × 100",
    inputs: ["f-op-cur", "f-rev-cur"],
    substitution: "9,640 / 148,200 × 100",
    result: 6.5,
    unit: "%",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-opm-pri",
    label: "Operating margin",
    formula: "Operating profit / Revenue × 100",
    inputs: ["f-op-pri", "f-rev-pri"],
    substitution: "11,880 / 132,450 × 100",
    result: 8.97,
    unit: "%",
    period: PRIOR_PERIOD,
  },
  {
    id: "c-npm-cur",
    label: "Net profit margin",
    formula: "Net profit / Revenue × 100",
    inputs: ["f-np-cur", "f-rev-cur"],
    substitution: "5,180 / 148,200 × 100",
    result: 3.49,
    unit: "%",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-npm-pri",
    label: "Net profit margin",
    formula: "Net profit / Revenue × 100",
    inputs: ["f-np-pri", "f-rev-pri"],
    substitution: "8,240 / 132,450 × 100",
    result: 6.22,
    unit: "%",
    period: PRIOR_PERIOD,
  },
  {
    id: "c-cr-cur",
    label: "Current ratio",
    formula: "Current assets / Current liabilities",
    inputs: ["f-ca-cur", "f-cl-cur"],
    substitution: "62,400 / 66,950",
    result: 0.93,
    unit: "x",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-cr-pri",
    label: "Current ratio",
    formula: "Current assets / Current liabilities",
    inputs: ["f-ca-pri", "f-cl-pri"],
    substitution: "58,120 / 49,300",
    result: 1.18,
    unit: "x",
    period: PRIOR_PERIOD,
  },
  {
    id: "c-de-cur",
    label: "Debt-to-equity",
    formula: "Borrowings / Shareholders' equity",
    inputs: ["f-debt-cur", "f-eq-cur"],
    substitution: "54,600 / 48,210",
    result: 1.13,
    unit: "x",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-de-pri",
    label: "Debt-to-equity",
    formula: "Borrowings / Shareholders' equity",
    inputs: ["f-debt-pri", "f-eq-pri"],
    substitution: "38,150 / 46,880",
    result: 0.81,
    unit: "x",
    period: PRIOR_PERIOD,
  },
  {
    id: "c-roa-cur",
    label: "Return on assets",
    formula: "Net profit / Total assets × 100",
    inputs: ["f-np-cur", "f-ta-cur"],
    substitution: "5,180 / 141,800 × 100",
    result: 3.65,
    unit: "%",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-roa-pri",
    label: "Return on assets",
    formula: "Net profit / Total assets × 100",
    inputs: ["f-np-pri", "f-ta-pri"],
    substitution: "8,240 / 128,640 × 100",
    result: 6.4,
    unit: "%",
    period: PRIOR_PERIOD,
  },
  {
    id: "c-roe-cur",
    label: "Return on equity",
    formula: "Net profit / Shareholders' equity × 100",
    inputs: ["f-np-cur", "f-eq-cur"],
    substitution: "5,180 / 48,210 × 100",
    result: 10.74,
    unit: "%",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-roe-pri",
    label: "Return on equity",
    formula: "Net profit / Shareholders' equity × 100",
    inputs: ["f-np-pri", "f-eq-pri"],
    substitution: "8,240 / 46,880 × 100",
    result: 17.58,
    unit: "%",
    period: PRIOR_PERIOD,
  },
  {
    id: "c-ocf-change",
    label: "Operating cash flow change",
    formula: "Operating cash flow FY2025 − Operating cash flow FY2024",
    inputs: ["f-ocf-cur", "f-ocf-pri"],
    substitution: "(2,310) − 7,905",
    result: -10_215,
    unit: "currency",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-debt-change",
    label: "Borrowings change",
    formula: "(Borrowings FY2025 − Borrowings FY2024) / Borrowings FY2024 × 100",
    inputs: ["f-debt-cur", "f-debt-pri"],
    substitution: "(54,600 − 38,150) / 38,150 × 100",
    result: 43.12,
    unit: "%",
    period: CURRENT_PERIOD,
  },
  {
    id: "c-recv-change",
    label: "Trade receivables change",
    formula: "(Receivables FY2025 − Receivables FY2024) / Receivables FY2024 × 100",
    inputs: ["f-recv-cur", "f-recv-pri"],
    substitution: "(41,900 − 29,600) / 29,600 × 100",
    result: 41.55,
    unit: "%",
    period: CURRENT_PERIOD,
  },
]

export const kpis: KpiMetric[] = [
  {
    key: "revenue",
    label: "Revenue",
    factId: "f-rev-cur",
    current: 148_200,
    prior: 132_450,
    currency: "MYR",
    format: "currency",
    higherIsBetter: true,
    status: "verified",
    calculationId: "c-rev-change",
  },
  {
    key: "net_profit",
    label: "Net profit",
    factId: "f-np-cur",
    current: 5_180,
    prior: 8_240,
    currency: "MYR",
    format: "currency",
    higherIsBetter: true,
    status: "verified",
    calculationId: "c-np-change",
  },
  {
    key: "operating_cash_flow",
    label: "Operating cash flow",
    factId: "f-ocf-cur",
    current: -2_310,
    prior: 7_905,
    currency: "MYR",
    format: "currency",
    higherIsBetter: true,
    status: "verified",
    calculationId: "c-ocf-change",
  },
  {
    key: "net_margin",
    label: "Net profit margin",
    factId: "f-np-cur",
    current: 3.49,
    prior: 6.22,
    currency: "MYR",
    format: "percent",
    higherIsBetter: true,
    status: "verified",
    calculationId: "c-npm-cur",
  },
  {
    key: "current_ratio",
    label: "Current ratio",
    factId: "f-ca-cur",
    current: 0.93,
    prior: 1.18,
    currency: "MYR",
    format: "ratio",
    higherIsBetter: true,
    status: "verified",
    calculationId: "c-cr-cur",
  },
  {
    key: "debt_equity",
    label: "Debt-to-equity",
    factId: "f-debt-cur",
    current: 1.13,
    prior: 0.81,
    currency: "MYR",
    format: "ratio",
    higherIsBetter: false,
    status: "verified",
    calculationId: "c-de-cur",
  },
]

/** Ratio comparison rows for the two-period comparison table. */
export const ratioComparison = [
  { key: "gpm", label: "Gross profit margin", unit: "%", current: 21.0, prior: 23.0, currentCalc: "c-gpm-cur", priorCalc: "c-gpm-pri", higherIsBetter: true },
  { key: "opm", label: "Operating margin", unit: "%", current: 6.5, prior: 8.97, currentCalc: "c-opm-cur", priorCalc: "c-opm-pri", higherIsBetter: true },
  { key: "npm", label: "Net profit margin", unit: "%", current: 3.49, prior: 6.22, currentCalc: "c-npm-cur", priorCalc: "c-npm-pri", higherIsBetter: true },
  { key: "cr", label: "Current ratio", unit: "x", current: 0.93, prior: 1.18, currentCalc: "c-cr-cur", priorCalc: "c-cr-pri", higherIsBetter: true },
  { key: "de", label: "Debt-to-equity", unit: "x", current: 1.13, prior: 0.81, currentCalc: "c-de-cur", priorCalc: "c-de-pri", higherIsBetter: false },
  { key: "roa", label: "Return on assets", unit: "%", current: 3.65, prior: 6.4, currentCalc: "c-roa-cur", priorCalc: "c-roa-pri", higherIsBetter: true },
  { key: "roe", label: "Return on equity", unit: "%", current: 10.74, prior: 17.58, currentCalc: "c-roe-cur", priorCalc: "c-roe-pri", higherIsBetter: true },
]

/** Five reporting periods of context for the trend chart. */
export const trendSeries: TrendPoint[] = [
  { period: "FY2021", metric: "Revenue", value: 96_400 },
  { period: "FY2022", metric: "Revenue", value: 108_900 },
  { period: "FY2023", metric: "Revenue", value: 121_300 },
  { period: "FY2024", metric: "Revenue", value: 132_450 },
  { period: "FY2025", metric: "Revenue", value: 148_200 },
  { period: "FY2021", metric: "Net profit", value: 5_900 },
  { period: "FY2022", metric: "Net profit", value: 7_100 },
  { period: "FY2023", metric: "Net profit", value: 7_950 },
  { period: "FY2024", metric: "Net profit", value: 8_240 },
  { period: "FY2025", metric: "Net profit", value: 5_180 },
  { period: "FY2021", metric: "Operating cash flow", value: 6_240 },
  { period: "FY2022", metric: "Operating cash flow", value: 6_980 },
  { period: "FY2023", metric: "Operating cash flow", value: 7_420 },
  { period: "FY2024", metric: "Operating cash flow", value: 7_905 },
  { period: "FY2025", metric: "Operating cash flow", value: -2_310 },
]

export const marginTrend: TrendPoint[] = [
  { period: "FY2021", metric: "Net profit margin", value: 6.12 },
  { period: "FY2022", metric: "Net profit margin", value: 6.52 },
  { period: "FY2023", metric: "Net profit margin", value: 6.55 },
  { period: "FY2024", metric: "Net profit margin", value: 6.22 },
  { period: "FY2025", metric: "Net profit margin", value: 3.49 },
  { period: "FY2021", metric: "Gross profit margin", value: 24.1 },
  { period: "FY2022", metric: "Gross profit margin", value: 23.8 },
  { period: "FY2023", metric: "Gross profit margin", value: 23.4 },
  { period: "FY2024", metric: "Gross profit margin", value: 23.0 },
  { period: "FY2025", metric: "Gross profit margin", value: 21.0 },
]

export const anomalies: Anomaly[] = [
  {
    id: "a-1",
    rule: "RULE-PROFIT-CASH-DIVERGENCE",
    title: "Profit is positive while operating cash flow is negative",
    detail:
      "Net profit of 5,180 thousand MYR was reported for FY2025 while net cash from operating activities was −2,310 thousand MYR, a swing of 10,215 thousand MYR from FY2024.",
    severity: "high",
    factIds: ["f-np-cur", "f-ocf-cur", "f-ocf-pri"],
    calculationIds: ["c-ocf-change"],
    followUp: "Ask which working-capital movements or non-cash items explain the gap between reported profit and cash generated.",
    needsManualReview: false,
  },
  {
    id: "a-2",
    rule: "RULE-REVENUE-UP-PROFIT-DOWN",
    title: "Revenue increased while net profit fell",
    detail:
      "Revenue rose 11.89% to 148,200 thousand MYR while net profit fell 37.14% to 5,180 thousand MYR. Gross margin narrowed from 23.0% to 21.0%.",
    severity: "high",
    factIds: ["f-rev-cur", "f-rev-pri", "f-np-cur", "f-np-pri"],
    calculationIds: ["c-rev-change", "c-np-change", "c-gpm-cur", "c-gpm-pri"],
    followUp: "Request a cost breakdown to identify whether input costs, pricing or one-off charges drove the margin compression.",
    needsManualReview: false,
  },
  {
    id: "a-3",
    rule: "RULE-WORKING-CAPITAL-DEFICIT",
    title: "Current liabilities exceed current assets",
    detail:
      "Current ratio moved from 1.18x to 0.93x as current liabilities reached 66,950 thousand MYR against current assets of 62,400 thousand MYR.",
    severity: "high",
    factIds: ["f-ca-cur", "f-cl-cur", "f-ca-pri", "f-cl-pri"],
    calculationIds: ["c-cr-cur", "c-cr-pri"],
    followUp: "Confirm the maturity profile of current liabilities and any undrawn facilities available within twelve months.",
    needsManualReview: false,
  },
  {
    id: "a-4",
    rule: "RULE-DEBT-INCREASE",
    title: "Borrowings rose materially between periods",
    detail:
      "Borrowings increased 43.12% from 38,150 to 54,600 thousand MYR, lifting debt-to-equity from 0.81x to 1.13x.",
    severity: "medium",
    factIds: ["f-debt-cur", "f-debt-pri", "f-eq-cur"],
    calculationIds: ["c-debt-change", "c-de-cur", "c-de-pri"],
    followUp: "Ask what the additional borrowings funded and whether covenants are tied to the debt-to-equity level.",
    needsManualReview: false,
  },
  {
    id: "a-5",
    rule: "RULE-RECEIVABLES-VS-REVENUE",
    title: "Receivables grew faster than revenue",
    detail:
      "Trade receivables grew 41.55% against revenue growth of 11.89%. The receivables figure is also inconsistent between the two uploaded sources.",
    severity: "medium",
    factIds: ["f-recv-cur", "f-recv-pri", "f-rev-cur"],
    calculationIds: ["c-recv-change", "c-rev-change"],
    followUp: "Request an ageing analysis and confirm which receivables figure is authoritative before relying on this comparison.",
    needsManualReview: true,
  },
  {
    id: "a-6",
    rule: "RULE-VALUE-CONFLICT",
    title: "Trade receivables conflict across two documents",
    detail:
      "The annual report states 41,900 thousand MYR (page 37) while the trial balance states 40,150 thousand MYR (Balances!F17). Both values are retained; neither was overwritten.",
    severity: "medium",
    factIds: ["f-recv-cur"],
    calculationIds: [],
    followUp: "Confirm with the preparer which source reflects the final audited position.",
    needsManualReview: true,
  },
  {
    id: "a-7",
    rule: "RULE-LOW-CONFIDENCE-EXTRACTION",
    title: "Trade payables could not be read reliably",
    detail:
      "The trade payables table on page 40 is a scanned region and returned low OCR confidence. No value was substituted and payables-based ratios were not calculated.",
    severity: "low",
    factIds: ["f-payables-cur"],
    calculationIds: [],
    followUp: "Re-upload a searchable copy of note 21 or enter the payables balance manually.",
    needsManualReview: true,
  },
]

export const insights: Insight[] = [
  {
    id: "i-1",
    title: "Growth is being funded by debt rather than operations",
    narrative:
      "Revenue grew for a fifth consecutive period, but the cash to support that growth did not come from trading. Operating cash flow turned negative while borrowings rose by more than two-fifths, and receivables absorbed a large part of the additional sales. On the figures extracted, the expansion in FY2025 was financed externally rather than self-funded.",
    factIds: ["f-rev-cur", "f-ocf-cur", "f-debt-cur", "f-recv-cur"],
    calculationIds: ["c-rev-change", "c-ocf-change", "c-debt-change", "c-recv-change"],
    tone: "concern",
  },
  {
    id: "i-2",
    title: "Margin compression is the main driver of the profit fall",
    narrative:
      "Gross margin narrowed by two percentage points and operating margin by roughly two and a half, so profit fell despite higher sales. Because the source document does not disclose profit before tax separately, the split between operating and financing effects cannot be confirmed from this report alone.",
    factIds: ["f-gp-cur", "f-op-cur", "f-np-cur", "f-pbt-cur"],
    calculationIds: ["c-gpm-cur", "c-gpm-pri", "c-opm-cur", "c-opm-pri", "c-npm-cur"],
    tone: "concern",
  },
  {
    id: "i-3",
    title: "Equity base held up and revenue momentum continued",
    narrative:
      "Shareholders' equity still increased year on year and the five-period revenue trend remains upward, so the balance sheet retains a cushion against the near-term liquidity pressure. Return on equity remains positive at 10.74%, though it is down from 17.58%.",
    factIds: ["f-eq-cur", "f-eq-pri", "f-rev-cur"],
    calculationIds: ["c-roe-cur", "c-roe-pri", "c-rev-change"],
    tone: "strength",
  },
]

export const followUpQuestions = [
  "Which working-capital movements explain the negative operating cash flow in FY2025?",
  "What did the additional 16,450 thousand MYR of borrowings fund?",
  "Are any current liabilities expected to be refinanced within twelve months?",
  "Which trade receivables figure is authoritative — the annual report or the trial balance?",
  "Can a searchable copy of note 21 be supplied so trade payables can be extracted?",
]

export const processingStages: ProcessingStage[] = [
  {
    key: "validate",
    title: "Validate input",
    description: "File type, size and parseability checks",
    duration: 1600,
    status: "pending",
    logs: [
      "Accepted northwind-annual-report-2025.pdf · 3.4 MB · searchable PDF · 68 pages",
      "Accepted northwind-trial-balance-2025.xlsx · 612 KB · 7 sheets",
      "Both files within the 20 MB per-file limit",
    ],
  },
  {
    key: "extract",
    title: "Extract fields",
    description: "Locate financial values and their source positions",
    duration: 2600,
    status: "pending",
    logs: [
      "Statement of Profit or Loss located on page 34",
      "Statement of Financial Position located on page 37",
      "Statement of Cash Flows located on page 41",
      "17 of 19 target fields located across 2 documents",
      "Page 40 note 21 returned low OCR confidence — flagged for manual review",
    ],
  },
  {
    key: "normalize",
    title: "Normalize",
    description: "Periods, currency and unit scale",
    duration: 1800,
    status: "pending",
    logs: [
      "Reporting periods resolved to FY2025 and FY2024",
      "Currency resolved to MYR · unit scale thousands",
      "Parenthesised figures converted to negative values",
      "Raw source values retained alongside normalized values",
    ],
  },
  {
    key: "calculate",
    title: "Calculate",
    description: "Deterministic changes and ratios in application code",
    duration: 1500,
    status: "pending",
    logs: [
      "19 deterministic calculations completed",
      "Payables-based ratios skipped — required input not readable",
      "Every calculation stored with its formula and input values",
    ],
  },
  {
    key: "detect",
    title: "Detect exceptions",
    description: "Configured anomaly rules",
    duration: 1400,
    status: "warning",
    logs: [
      "7 of 12 configured rules triggered",
      "1 cross-document value conflict retained without repair",
      "3 items require manual review",
    ],
  },
  {
    key: "explain",
    title: "Generate explanation",
    description: "Plain-language narrative grounded in verified facts",
    duration: 2000,
    status: "pending",
    logs: [
      "Narrative generated from 17 verified facts and 19 calculations",
      "No value was generated by the language model",
      "5 follow-up questions prepared",
    ],
  },
]

// --- lookup helpers -------------------------------------------------------

export const factById = (id: string) => facts.find((f) => f.id === id)
export const calculationById = (id: string) => calculations.find((c) => c.id === id)

export function factsFor(ids: string[]) {
  return ids.map(factById).filter((f): f is (typeof facts)[number] => Boolean(f))
}

export function calculationsFor(ids: string[]) {
  return ids.map(calculationById).filter((c): c is (typeof calculations)[number] => Boolean(c))
}
