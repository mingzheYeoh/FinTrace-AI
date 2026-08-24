"use client"

import { Card, Col, Flex, Row, Space, Tag, Tooltip, Typography } from "antd"
import { ArrowDownOutlined, ArrowUpOutlined, LinkOutlined, MinusOutlined } from "@ant-design/icons"
import { CURRENT_PERIOD, PRIOR_PERIOD, kpis } from "@/lib/mock-data"
import { formatMetric, percentChange } from "@/lib/format"
import { useEvidence } from "@/components/evidence/evidence-context"
import type { KpiMetric } from "@/lib/types"

const { Text } = Typography

function changeTone(change: number | null, higherIsBetter: boolean) {
  if (change === null || Math.abs(change) < 0.01) return { color: "var(--ink-faint)", good: null as boolean | null }
  const improving = change > 0 === higherIsBetter
  return { color: improving ? "var(--good)" : "var(--alert)", good: improving }
}

function KpiCard({ kpi }: { kpi: KpiMetric }) {
  const { openEvidence } = useEvidence()
  const change = percentChange(kpi.current, kpi.prior)
  const tone = changeTone(change, kpi.higherIsBetter)
  const crossedZero = kpi.current !== null && kpi.prior !== null && kpi.current < 0 && kpi.prior >= 0

  const trace = () =>
    openEvidence({
      title: kpi.label,
      subtitle: `${CURRENT_PERIOD} compared with ${PRIOR_PERIOD}, traced to source values and formula.`,
      factIds: [kpi.factId, kpi.factId.replace("-cur", "-pri")],
      calculationIds: kpi.calculationId ? [kpi.calculationId] : [],
    })

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
          color: kpi.current !== null && kpi.current < 0 ? "var(--alert)" : "var(--ink)",
        }}
      >
        {kpi.current === null ? "—" : formatMetric(kpi.current, kpi.format, kpi.currency)}
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
          <span className="numeric">
            {change === null ? "n/a" : `${Math.abs(change).toFixed(2)}%`}
          </span>
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          vs {kpi.prior === null ? "—" : formatMetric(kpi.prior, kpi.format, kpi.currency)} in {PRIOR_PERIOD}
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

export function KpiGrid() {
  return (
    <Row gutter={[12, 12]}>
      {kpis.map((kpi) => (
        <Col key={kpi.key} xs={24} sm={12} lg={8} xl={4}>
          <KpiCard kpi={kpi} />
        </Col>
      ))}
    </Row>
  )
}
