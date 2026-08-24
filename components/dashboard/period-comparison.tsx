"use client"

import { Card, Space, Table, Tag, Tooltip, Typography } from "antd"
import type { TableProps } from "antd"
import { ArrowDownOutlined, ArrowUpOutlined, LinkOutlined } from "@ant-design/icons"
import { CURRENT_PERIOD, PRIOR_PERIOD, calculationById, facts, ratioComparison } from "@/lib/mock-data"
import { formatCurrency, formatNumber, statusMeta } from "@/lib/format"
import { useEvidence } from "@/components/evidence/evidence-context"

const { Text } = Typography

// --- line item comparison -------------------------------------------------

interface LineRow {
  key: string
  label: string
  current: number | null
  prior: number | null
  currentFactId: string
  priorFactId: string
  status: (typeof facts)[number]["status"]
  calcId?: string
  note?: string
}

const lineItems: LineRow[] = [
  { key: "revenue", label: "Revenue", current: 148_200, prior: 132_450, currentFactId: "f-rev-cur", priorFactId: "f-rev-pri", status: "verified", calcId: "c-rev-change" },
  { key: "gross_profit", label: "Gross profit", current: 31_122, prior: 30_463, currentFactId: "f-gp-cur", priorFactId: "f-gp-pri", status: "verified" },
  { key: "operating_profit", label: "Operating profit", current: 9_640, prior: 11_880, currentFactId: "f-op-cur", priorFactId: "f-op-pri", status: "verified" },
  { key: "profit_before_tax", label: "Profit before tax", current: null, prior: null, currentFactId: "f-pbt-cur", priorFactId: "f-pbt-cur", status: "not_present", note: "Not disclosed separately in this source" },
  { key: "net_profit", label: "Net profit", current: 5_180, prior: 8_240, currentFactId: "f-np-cur", priorFactId: "f-np-pri", status: "verified", calcId: "c-np-change" },
  { key: "operating_cash_flow", label: "Operating cash flow", current: -2_310, prior: 7_905, currentFactId: "f-ocf-cur", priorFactId: "f-ocf-pri", status: "verified", calcId: "c-ocf-change" },
  { key: "current_assets", label: "Current assets", current: 62_400, prior: 58_120, currentFactId: "f-ca-cur", priorFactId: "f-ca-pri", status: "verified" },
  { key: "current_liabilities", label: "Current liabilities", current: 66_950, prior: 49_300, currentFactId: "f-cl-cur", priorFactId: "f-cl-pri", status: "verified" },
  { key: "total_assets", label: "Total assets", current: 141_800, prior: 128_640, currentFactId: "f-ta-cur", priorFactId: "f-ta-pri", status: "verified" },
  { key: "equity", label: "Shareholders' equity", current: 48_210, prior: 46_880, currentFactId: "f-eq-cur", priorFactId: "f-eq-pri", status: "verified" },
  { key: "borrowings", label: "Borrowings", current: 54_600, prior: 38_150, currentFactId: "f-debt-cur", priorFactId: "f-debt-pri", status: "verified", calcId: "c-debt-change" },
  { key: "receivables", label: "Trade receivables", current: 41_900, prior: 29_600, currentFactId: "f-recv-cur", priorFactId: "f-recv-pri", status: "conflicting", calcId: "c-recv-change", note: "Sources disagree — 40,150 in the trial balance" },
  { key: "payables", label: "Trade payables", current: null, prior: null, currentFactId: "f-payables-cur", priorFactId: "f-payables-cur", status: "not_readable", note: "Scanned region, low OCR confidence" },
  { key: "inventory", label: "Inventory", current: 14_310, prior: 12_040, currentFactId: "f-inv-cur", priorFactId: "f-inv-pri", status: "verified" },
  { key: "cash", label: "Cash and equivalents", current: 4_820, prior: 11_240, currentFactId: "f-cash-cur", priorFactId: "f-cash-pri", status: "verified" },
]

function ChangeCell({ current, prior, invert = false }: { current: number | null; prior: number | null; invert?: boolean }) {
  if (current === null || prior === null) {
    return (
      <Text type="secondary" style={{ fontSize: 12.5 }}>
        Not comparable
      </Text>
    )
  }
  if (prior === 0) {
    return (
      <Text type="secondary" style={{ fontSize: 12.5 }}>
        n/a
      </Text>
    )
  }

  const pct = ((current - prior) / Math.abs(prior)) * 100
  const improving = invert ? pct < 0 : pct > 0
  const color = Math.abs(pct) < 0.01 ? "var(--ink-faint)" : improving ? "var(--good)" : "var(--alert)"

  return (
    <Space size={3} style={{ color, fontWeight: 500 }}>
      {pct >= 0 ? <ArrowUpOutlined aria-hidden /> : <ArrowDownOutlined aria-hidden />}
      <span className="numeric">{formatNumber(Math.abs(pct), 2)}%</span>
    </Space>
  )
}

export function PeriodComparison() {
  const { openEvidence } = useEvidence()

  const lineColumns: TableProps<LineRow>["columns"] = [
    {
      title: "Line item",
      dataIndex: "label",
      key: "label",
      render: (label: string, row) => (
        <Space size={6} wrap>
          <Text style={{ fontSize: 13.5 }}>{label}</Text>
          {row.status !== "verified" && (
            <Tooltip title={row.note}>
              <Tag color={statusMeta[row.status].color} variant="filled" style={{ fontSize: 11, marginInlineEnd: 0 }}>
                {statusMeta[row.status].label}
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: CURRENT_PERIOD,
      dataIndex: "current",
      key: "current",
      align: "right",
      width: 150,
      render: (value: number | null) =>
        value === null ? (
          <Text type="secondary">—</Text>
        ) : (
          <span className="numeric" style={{ color: value < 0 ? "var(--alert)" : undefined, fontWeight: 500 }}>
            {formatCurrency(value)}
          </span>
        ),
    },
    {
      title: PRIOR_PERIOD,
      dataIndex: "prior",
      key: "prior",
      align: "right",
      width: 150,
      render: (value: number | null) =>
        value === null ? (
          <Text type="secondary">—</Text>
        ) : (
          <span className="numeric" style={{ color: value < 0 ? "var(--alert)" : undefined }}>
            {formatCurrency(value)}
          </span>
        ),
    },
    {
      title: "Change",
      key: "change",
      align: "right",
      width: 130,
      render: (_, row) => <ChangeCell current={row.current} prior={row.prior} />,
    },
    {
      title: "",
      key: "trace",
      width: 44,
      align: "center",
      render: () => (
        <Tooltip title="Trace to source">
          <LinkOutlined style={{ color: "var(--ink-faint)", fontSize: 12 }} aria-hidden />
        </Tooltip>
      ),
    },
  ]

  const ratioColumns: TableProps<(typeof ratioComparison)[number]>["columns"] = [
    {
      title: "Ratio",
      dataIndex: "label",
      key: "label",
      render: (label: string, row) => {
        const calc = calculationById(row.currentCalc)
        return (
          <div>
            <Text style={{ fontSize: 13.5 }}>{label}</Text>
            <div className="numeric" style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
              {calc?.formula}
            </div>
          </div>
        )
      },
    },
    {
      title: CURRENT_PERIOD,
      dataIndex: "current",
      key: "current",
      align: "right",
      width: 130,
      render: (value: number, row) => (
        <span className="numeric" style={{ fontWeight: 500 }}>
          {formatNumber(value, 2)}
          {row.unit}
        </span>
      ),
    },
    {
      title: PRIOR_PERIOD,
      dataIndex: "prior",
      key: "prior",
      align: "right",
      width: 130,
      render: (value: number, row) => (
        <span className="numeric">
          {formatNumber(value, 2)}
          {row.unit}
        </span>
      ),
    },
    {
      title: "Change",
      key: "change",
      align: "right",
      width: 130,
      render: (_, row) => <ChangeCell current={row.current} prior={row.prior} invert={!row.higherIsBetter} />,
    },
    {
      title: "",
      key: "trace",
      width: 44,
      align: "center",
      render: () => (
        <Tooltip title="Trace to formula and inputs">
          <LinkOutlined style={{ color: "var(--ink-faint)", fontSize: 12 }} aria-hidden />
        </Tooltip>
      ),
    },
  ]

  return (
    <Card
      title={`Two-period comparison · ${CURRENT_PERIOD} vs ${PRIOR_PERIOD}`}
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          Select any row to open its evidence
        </Text>
      }
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: "14px 20px 0" }}>
        <div className="eyebrow">Statement line items · MYR thousands</div>
      </div>
      <Table
        size="small"
        columns={lineColumns}
        dataSource={lineItems}
        pagination={false}
        rowClassName="traceable-row"
        style={{ marginTop: 8 }}
        onRow={(row) => ({
          onClick: () =>
            openEvidence({
              title: row.label,
              subtitle: `${CURRENT_PERIOD} compared with ${PRIOR_PERIOD}.`,
              factIds: row.currentFactId === row.priorFactId ? [row.currentFactId] : [row.currentFactId, row.priorFactId],
              calculationIds: row.calcId ? [row.calcId] : [],
            }),
          tabIndex: 0,
          "aria-label": `${row.label}. Open source evidence.`,
        })}
      />

      <div style={{ padding: "22px 20px 0", borderTop: "1px solid var(--rule-soft)" }}>
        <div className="eyebrow">Deterministic ratios</div>
      </div>
      <Table
        size="small"
        columns={ratioColumns}
        dataSource={ratioComparison}
        pagination={false}
        rowClassName="traceable-row"
        style={{ marginTop: 8 }}
        onRow={(row) => ({
          onClick: () =>
            openEvidence({
              title: row.label,
              subtitle: "Calculated in application code from stored normalized values.",
              factIds: [
                ...(calculationById(row.currentCalc)?.inputs ?? []),
                ...(calculationById(row.priorCalc)?.inputs ?? []),
              ],
              calculationIds: [row.currentCalc, row.priorCalc],
            }),
          tabIndex: 0,
          "aria-label": `${row.label}. Open formula and inputs.`,
        })}
      />
    </Card>
  )
}
