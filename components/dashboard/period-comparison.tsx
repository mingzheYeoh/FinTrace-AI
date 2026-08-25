"use client"

import { useMemo } from "react"
import { Button, Card, Space, Table, Tag, Tooltip, Typography } from "antd"
import type { TableProps } from "antd"
import { ArrowDownOutlined, ArrowUpOutlined, LinkOutlined } from "@ant-design/icons"
import type { Calculation, FinancialField, RatioComparison } from "@/src/lib/api/client"
import { toNumber } from "@/src/features/analysis/present"
import { formatCurrency, formatNumber, statusMeta } from "@/lib/format"
import { useEvidence } from "@/components/evidence/evidence-context"

const { Text } = Typography

type Props = {
  fields: FinancialField[]
  ratios: RatioComparison[]
  calculations: Calculation[]
  currentPeriod: string
  priorPeriod: string
}

function ChangeCell({
  percentageChange,
  invert = false,
}: {
  percentageChange: string | null
  invert?: boolean
}) {
  const pct = toNumber(percentageChange)

  // A missing or unreadable figure is not comparable. Never imply a zero change.
  if (pct === null) {
    return (
      <Text type="secondary" style={{ fontSize: 12.5 }}>
        Not comparable
      </Text>
    )
  }

  const improving = invert ? pct < 0 : pct > 0
  const color = Math.abs(pct) < 0.01 ? "var(--ink-faint)" : improving ? "var(--good)" : "var(--alert)"

  return (
    <Space className="comparison-change" size={3} style={{ color, fontWeight: 500 }}>
      {pct >= 0 ? <ArrowUpOutlined aria-hidden /> : <ArrowDownOutlined aria-hidden />}
      <span className="numeric">{formatNumber(Math.abs(pct), 2)}%</span>
    </Space>
  )
}

/** Renders a period figure, or an em dash when the value could not be established. */
function ValueCell({ value, emphasis = false }: { value: string | null; emphasis?: boolean }) {
  const parsed = toNumber(value)
  if (parsed === null) return <Text type="secondary">—</Text>
  return (
    <span
      className="numeric financial-value"
      style={{ color: parsed < 0 ? "var(--alert)" : undefined, fontWeight: emphasis ? 500 : undefined }}
    >
      {formatCurrency(parsed)}
    </span>
  )
}

function EvidenceButton({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <Tooltip title={`Open evidence for ${label}`}>
      <Button
        type="text"
        className="evidence-action"
        icon={<LinkOutlined aria-hidden />}
        aria-label={`Open evidence for ${label}`}
        onClick={(event) => {
          event.stopPropagation()
          onOpen()
        }}
      />
    </Tooltip>
  )
}

export function PeriodComparison({ fields, ratios, calculations, currentPeriod, priorPeriod }: Props) {
  const { openEvidence } = useEvidence()

  const calcById = useMemo(() => new Map(calculations.map((c) => [c.id, c])), [calculations])

  const lineColumns: TableProps<FinancialField>["columns"] = [
    {
      title: "Line item",
      dataIndex: "label",
      key: "label",
      width: 280,
      render: (label: string, row) => (
        <Space size={6} wrap>
          <Text style={{ fontSize: 13.5 }}>{label}</Text>
          {row.status !== "verified" && (
            <Tooltip title={row.note ?? undefined}>
              <Tag
                color={statusMeta[row.status].color}
                variant="filled"
                style={{ fontSize: 11, marginInlineEnd: 0 }}
              >
                {statusMeta[row.status].label}
              </Tag>
            </Tooltip>
          )}
          {row.requires_manual_review && (
            <Tag variant="outlined" style={{ fontSize: 11, marginInlineEnd: 0 }}>
              Review
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: currentPeriod,
      key: "current",
      align: "right",
      width: 230,
      render: (_, row) => <ValueCell value={row.current.value} emphasis />,
    },
    {
      title: priorPeriod,
      key: "prior",
      align: "right",
      width: 230,
      render: (_, row) => <ValueCell value={row.prior.value} />,
    },
    {
      title: "Change",
      key: "change",
      align: "right",
      width: 160,
      render: (_, row) => <ChangeCell percentageChange={row.percentage_change} />,
    },
    {
      title: <span className="sr-only">Evidence</span>,
      key: "trace",
      width: 72,
      align: "center",
      render: (_, row) => (
        <EvidenceButton
          label={row.label}
          onOpen={() => openEvidence({ evidenceId: row.evidence_id, fallbackTitle: row.label })}
        />
      ),
    },
  ]

  const ratioColumns: TableProps<RatioComparison>["columns"] = [
    {
      title: "Ratio",
      dataIndex: "label",
      key: "label",
      width: 280,
      render: (label: string, row) => {
        const calc = calcById.get(row.current_calculation_id)
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
      title: currentPeriod,
      key: "current",
      align: "right",
      width: 230,
      render: (_, row) => {
        const value = toNumber(row.current)
        return value === null ? (
          <Text type="secondary">—</Text>
        ) : (
          <span className="numeric financial-value" style={{ fontWeight: 500 }}>
            {formatNumber(value, 2)}
            {row.unit === "percentage" ? "%" : row.unit === "ratio" ? "x" : ""}
          </span>
        )
      },
    },
    {
      title: priorPeriod,
      key: "prior",
      align: "right",
      width: 230,
      render: (_, row) => {
        const value = toNumber(row.prior)
        return value === null ? (
          <Text type="secondary">—</Text>
        ) : (
          <span className="numeric financial-value">
            {formatNumber(value, 2)}
            {row.unit === "percentage" ? "%" : row.unit === "ratio" ? "x" : ""}
          </span>
        )
      },
    },
    {
      title: "Change",
      key: "change",
      align: "right",
      width: 160,
      render: (_, row) => (
        <ChangeCell percentageChange={row.percentage_change} invert={!row.higher_is_better} />
      ),
    },
    {
      title: <span className="sr-only">Evidence</span>,
      key: "trace",
      width: 72,
      align: "center",
      render: (_, row) => (
        <EvidenceButton
          label={row.label}
          onOpen={() => openEvidence({ evidenceId: row.evidence_id, fallbackTitle: row.label })}
        />
      ),
    },
  ]

  return (
    <Card
      title={`Two-period comparison · ${currentPeriod} vs ${priorPeriod}`}
      className="comparison-card"
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          Use the evidence action on any row to trace its source
        </Text>
      }
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: "14px 20px 0" }}>
        <div className="eyebrow">Statement line items · MYR thousands</div>
      </div>
      <Table
        className="comparison-table"
        size="small"
        rowKey="id"
        columns={lineColumns}
        dataSource={fields}
        pagination={false}
        // Financial tables must not shrink their figures — scroll them instead.
        scroll={{ x: 1100 }}
        style={{ marginTop: 8 }}
      />

      <div style={{ padding: "22px 20px 0", borderTop: "1px solid var(--rule-soft)" }}>
        <div className="eyebrow">Deterministic ratios</div>
      </div>
      <Table
        className="comparison-table"
        size="small"
        rowKey="id"
        columns={ratioColumns}
        dataSource={ratios}
        pagination={false}
        scroll={{ x: 1100 }}
        style={{ marginTop: 8 }}
      />
    </Card>
  )
}
