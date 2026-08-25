"use client"

import { useMemo } from "react"
import { Alert, Button, Card, Col, Flex, Progress, Row, Space, Steps, Tag, Typography } from "antd"
import {
  CheckCircleFilled,
  CloseCircleFilled,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LoadingOutlined,
  WarningFilled,
} from "@ant-design/icons"
import { FinTraceApiError } from "@/src/lib/api/client"
import { useAnalysisResult, useAnalysisStatus } from "@/src/features/analysis/queries"
import {
  presentProcessingStatus,
  type ResultPresentationState,
} from "@/src/features/analysis/processing-presentation"
import type { StagedFile } from "@/components/upload/upload-panel"

const { Title, Text, Paragraph } = Typography

const kindIcon = {
  pdf: <FilePdfOutlined style={{ color: "var(--alert)" }} />,
  xlsx: <FileExcelOutlined style={{ color: "var(--good)" }} />,
  csv: <FileTextOutlined style={{ color: "var(--ink-soft)" }} />,
}

interface ProcessingViewProps {
  analysisId: string
  files: StagedFile[]
  onComplete: () => void
  onCancel: () => void
}

export function ProcessingView({ analysisId, files, onComplete, onCancel }: ProcessingViewProps) {
  const statusQuery = useAnalysisStatus(analysisId)
  const status = statusQuery.data

  const isCompleted = status?.status === "completed"

  // Result is fetched only after terminal completion, per the contract.
  const resultQuery = useAnalysisResult(analysisId, isCompleted)

  const statusError = statusQuery.error
  const analysisMissing = statusError instanceof FinTraceApiError && statusError.status === 404

  // A 409 means the result is not ready; processing state is preserved.
  const resultError = resultQuery.error
  const resultNotReady = resultError instanceof FinTraceApiError && resultError.status === 409
  const resultState: ResultPresentationState = resultQuery.isSuccess
    ? "ready"
    : isCompleted && resultQuery.isPending
      ? "loading"
      : resultNotReady
        ? "not_ready"
        : resultQuery.isError
          ? "error"
          : "idle"
  const presentation = presentProcessingStatus(status, resultState)

  const stages = useMemo(() => status?.stages ?? [], [status?.stages])
  const total = stages.length || 6
  const activeIndex = useMemo(() => {
    if (!status) return 0
    if (status.status === "completed") return total
    const index = stages.findIndex((stage) => stage.key === status.active_stage)
    return index >= 0 ? index : 0
  }, [stages, status, total])

  const visibleLogs = useMemo(
    () =>
      stages.flatMap((stage) =>
        stage.logs.map((text) => ({ text, stage: stage.title })),
      ),
    [stages],
  )

  const stepItems = stages.map((stage) => ({
    title: stage.title,
    content: (
      <Text type="secondary" style={{ fontSize: 12.5 }}>
        {stage.description}
      </Text>
    ),
    status:
      stage.state === "failed"
        ? ("error" as const)
        : stage.state === "completed" || stage.state === "warning"
          ? ("finish" as const)
          : stage.state === "active"
            ? ("process" as const)
            : ("wait" as const),
    icon:
      stage.state === "active" ? (
        <LoadingOutlined style={{ color: "var(--accent)" }} />
      ) : stage.state === "failed" ? (
        <CloseCircleFilled style={{ color: "var(--alert)" }} />
      ) : stage.state === "warning" ? (
        <WarningFilled style={{ color: "var(--caution)" }} />
      ) : stage.state === "completed" ? (
        <CheckCircleFilled style={{ color: "var(--good)" }} />
      ) : undefined,
  }))

  if (analysisMissing) {
    return (
      <Card title="Analysis unavailable">
        <Alert
          type="error"
          showIcon
          title="This analysis could not be found"
          description={statusError instanceof Error ? statusError.message : undefined}
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" onClick={onCancel}>
          Return to upload
        </Button>
      </Card>
    )
  }

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={14}>
        <Card
          title="Processing"
          className="processing-card"
          data-tone={presentation.tone}
          extra={
            <Tag color={presentation.badgeColor} variant="filled" style={{ marginInlineEnd: 0 }}>
              {presentation.badgeLabel}
            </Tag>
          }
        >
          <Flex align="center" gap={20} wrap style={{ marginBottom: 24 }}>
            <Progress
              type="circle"
              percent={status?.progress_percent ?? 0}
              size={92}
              strokeColor={
                presentation.tone === "error"
                  ? "var(--alert)"
                  : presentation.tone === "warning"
                    ? "var(--caution)"
                    : presentation.tone === "success"
                      ? "var(--good)"
                      : "var(--accent)"
              }
              status={
                presentation.tone === "error"
                  ? "exception"
                  : presentation.tone === "success"
                    ? "success"
                    : presentation.tone === "processing"
                      ? "active"
                      : "normal"
              }
            />
            <div style={{ flex: "1 1 220px", minWidth: 200 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                {presentation.kicker}
              </div>
              <Title level={4} style={{ margin: "0 0 4px", fontSize: 17 }}>
                {presentation.hero}
              </Title>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
                {presentation.subtitle}
              </Paragraph>
            </div>
          </Flex>

          {stepItems.length > 0 && (
            <Steps
              orientation="vertical"
              size="small"
              current={isCompleted ? total : activeIndex}
              items={stepItems}
              aria-label="Extraction pipeline progress"
            />
          )}

          {presentation.resultAlert && (
            <Alert
              type={presentation.resultAlert.type}
              showIcon
              style={{ marginTop: 16 }}
              title={presentation.resultAlert.title}
              description={presentation.resultAlert.description}
              action={
                <Button size="small" onClick={() => resultQuery.refetch()}>
                  Retry
                </Button>
              }
            />
          )}

          <div className="processing-actions" aria-label="Processing actions">
            <Button onClick={onCancel}>Start over</Button>
            {presentation.showDashboardAction && (
              <Button
                type="primary"
                disabled={!presentation.dashboardEnabled}
                loading={presentation.dashboardLoading}
                onClick={onComplete}
              >
                Open analysis dashboard
              </Button>
            )}
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Flex vertical gap={20}>
          <Card title="Sources being read" size="small">
            <Flex vertical gap={10}>
              {files.map((file) => (
                <Flex key={file.uid} justify="space-between" align="center" gap={10}>
                  <Space size={8}>
                    {kindIcon[file.kind]}
                    <span className="numeric" style={{ fontSize: 12.5 }}>
                      {file.name}
                    </span>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {file.sizeLabel}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Card>

          <Card title="Pipeline log" size="small" styles={{ body: { maxHeight: 340, overflowY: "auto" } }}>
            {visibleLogs.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12.5 }}>
                Waiting for the first stage…
              </Text>
            ) : (
              <div className="stage-log" role="status" aria-live="polite">
                {visibleLogs.map((line, i) => (
                  <div key={`${line.stage}-${i}`} style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--ink-faint)", flex: "0 0 auto" }}>›</span>
                    <span>{line.text}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {presentation.sideAlert && (
            <Alert
              type={presentation.sideAlert.type}
              showIcon
              title={presentation.sideAlert.title}
              description={presentation.sideAlert.description}
            />
          )}
        </Flex>
      </Col>
    </Row>
  )
}
