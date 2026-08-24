"use client"

import { Alert, Button, Card, Col, Flex, Row, Skeleton } from "antd"
import { CaseHeader } from "@/components/dashboard/case-header"
import { KpiGrid } from "@/components/dashboard/kpi-grid"
import { PeriodComparison } from "@/components/dashboard/period-comparison"
import { TrendCharts } from "@/components/dashboard/trend-charts"
import { AnomalyPanel } from "@/components/dashboard/anomaly-panel"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { useAnalysisResult } from "@/src/features/analysis/queries"

interface AnalysisDashboardProps {
  analysisId: string
  onReset: () => void
}

/**
 * Reads the cached `getAnalysisResult` payload once and distributes it as typed
 * props. No child component fetches the result or imports a fixture.
 */
export function AnalysisDashboard({ analysisId, onReset }: AnalysisDashboardProps) {
  const { data, isPending, error, refetch } = useAnalysisResult(analysisId, true)

  if (isPending) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card title="Analysis result unavailable">
        <Alert
          type="error"
          showIcon
          title="The analysis result could not be loaded"
          description={error instanceof Error ? error.message : undefined}
          style={{ marginBottom: 16 }}
        />
        <Flex gap={10}>
          <Button type="primary" onClick={() => refetch()}>
            Retry
          </Button>
          <Button onClick={onReset}>Start over</Button>
        </Flex>
      </Card>
    )
  }

  return (
    <Flex vertical gap={16}>
      <CaseHeader summary={data.summary} onReset={onReset} />

      <KpiGrid kpis={data.kpis} currency={data.summary.currency} />

      <TrendCharts trends={data.trends} />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={13}>
          <PeriodComparison
            fields={data.fields}
            ratios={data.ratios}
            currentPeriod={data.summary.current_period}
            priorPeriod={data.summary.prior_period}
            currency={data.summary.currency}
          />
        </Col>
        <Col xs={24} xl={11}>
          <Flex vertical gap={16}>
            <AnomalyPanel anomalies={data.anomalies} />
            <InsightsPanel insights={data.insights} followUpQuestions={data.follow_up_questions} />
          </Flex>
        </Col>
      </Row>
    </Flex>
  )
}
