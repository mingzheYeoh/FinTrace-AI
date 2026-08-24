"use client"

import { Col, Flex, Row } from "antd"
import { CaseHeader } from "@/components/dashboard/case-header"
import { KpiGrid } from "@/components/dashboard/kpi-grid"
import { PeriodComparison } from "@/components/dashboard/period-comparison"
import { TrendCharts } from "@/components/dashboard/trend-charts"
import { AnomalyPanel } from "@/components/dashboard/anomaly-panel"
import { InsightsPanel } from "@/components/dashboard/insights-panel"

export function AnalysisDashboard({ onReset }: { onReset: () => void }) {
  return (
    <Flex vertical gap={16}>
      <CaseHeader onReset={onReset} />

      <KpiGrid />

      <TrendCharts />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={13}>
          <PeriodComparison />
        </Col>
        <Col xs={24} xl={11}>
          <Flex vertical gap={16}>
            <AnomalyPanel />
            <InsightsPanel />
          </Flex>
        </Col>
      </Row>
    </Flex>
  )
}
