"use client"

import { Card, Col, Flex, Row, Space, Tag, Tooltip, Typography } from "antd"
import { ArrowDownOutlined, ArrowUpOutlined, LinkOutlined, MinusOutlined } from "@ant-design/icons"
import { formatMetric } from "@/lib/format"
import { useEvidence } from "@/components/evidence/evidence-context"
import type { KpiMetric } from "@/src/lib/api/client"
import { toFormatKind, toNumber } from "@/src/features/analysis/present"

const { Text } = Typography

function changeTone(change: number | null, higherIsBetter: boolean) {
  if (change === null || Math.abs(change) < 0.01) return { color: "var(--ink-faint)" }
  const improving = change > 0 === higherIsBetter
  return { color: improving ? "var(--good)" : "var(--alert)" }
}

function KpiCard({ kpi, currency }: { kpi: KpiMetric; currency: string }) {
  const { openEvidence } = useEvidence()

  // The API supplies authoritative changes; components never recompute them.
  const current = toNumber(kpi.current)
  const prior = toNumber(kpi.prior)
  const change = toNumber(kpi.percentage_change)
  const tone = changeTone(change, kpi.higher_is_better)
  const format = toFormatKind(kpi.format)
  const crossedZero = current !== null && prior !== null && current < 0 && prior >= 0

  const trace = () => openEvidence({ evidenceId: kpi.evidence_id, fallbackTitle: kpi.label })

  return (
    <Card
      size="small"
      hoverable
      onClick={trace}
      className="traceable-row"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          trace()
        }
      }}
      aria-label={`${kpi.label}. Open source evidence.`}
      styles={{ body: { padding: 16 } }}
    >
      <Flex justify="space-between" align="flex-start" gap={8}>
        <div className="eyebrow" style={{ lineHeight: 1.4 }}>
          {kpi.label}
        </div>
        <Tooltip title="Trace to source and formula">
          <LinkOutlined style={{ color: "var(--ink-faint)", fontSize: 12 }} aria-hidden />
        </Tooltip>
      </Flex>

      <div
        className="numeric"
        style={{
          fontSize: 25,
          fontWeight: 600,
          lineHeight: 1.2,
          marginTop: 10,
          color: current !== null && current < 0 ? "var(--alert)" : "var(--ink)",
        }}
      >
        {current === null ? "—" : formatMetric(current, format, currency)}
      </div>

      <Flex align="center" gap={8} style={{ marginTop: 10 }} wrap>
        <Space size={3} style={{ color: tone.color, fontSize: 13, fontWeight: 500 }}>
          {change === null ? (
            <MinusOutlined />
          ) : change > 0 ? (
            <ArrowUpOutlined aria-hidden />
          ) : (
            <ArrowDownOutlined aria-hidden />
          )}
          <span className="numeric">{change === null ? "n/a" : `${Math.abs(change).toFixed(2)}%`}</span>
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          vs {prior === null ? "—" : formatMetric(prior, format, currency)} prior period
        </Text>
      </Flex>

      {crossedZero && (
        <Tag color="red" variant="filled" style={{ marginTop: 10, marginInlineEnd: 0, fontSize: 11 }}>
          Turned negative
        </Tag>
      )}
    </Card>
  )
}

export function KpiGrid({ kpis, currency }: { kpis: KpiMetric[]; currency: string }) {
  return (
    <Row gutter={[12, 12]}>
      {kpis.map((kpi) => (
        <Col key={kpi.id} xs={24} sm={12} lg={8} xl={4}>
          <KpiCard kpi={kpi} currency={currency} />
        </Col>
      ))}
    </Row>
  )
}
