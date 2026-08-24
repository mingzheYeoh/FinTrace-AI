"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Alert, Button, Card, Col, Flex, Progress, Row, Space, Steps, Tag, Typography } from "antd"
import {
  CheckCircleFilled,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LoadingOutlined,
  WarningFilled,
} from "@ant-design/icons"
import { processingStages } from "@/lib/mock-data"
import type { StagedFile } from "@/components/upload/upload-panel"

const { Title, Text, Paragraph } = Typography

const kindIcon = {
  pdf: <FilePdfOutlined style={{ color: "var(--alert)" }} />,
  xlsx: <FileExcelOutlined style={{ color: "var(--good)" }} />,
  csv: <FileTextOutlined style={{ color: "var(--ink-soft)" }} />,
}

interface ProcessingViewProps {
  files: StagedFile[]
  onComplete: () => void
  onCancel: () => void
}

export function ProcessingView({ files, onComplete, onCancel }: ProcessingViewProps) {
  const [stageIndex, setStageIndex] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)
  const [finished, setFinished] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const total = processingStages.length

  useEffect(() => {
    let cancelled = false
    let index = 0

    const runStage = () => {
      if (cancelled) return
      if (index >= total) {
        setFinished(true)
        return
      }

      const stage = processingStages[index]
      const started = Date.now()
      setStageIndex(index)
      setStageProgress(0)

      const tick = setInterval(() => {
        if (cancelled) return
        const pct = Math.min(100, ((Date.now() - started) / stage.duration) * 100)
        setStageProgress(pct)
        if (pct >= 100) {
          clearInterval(tick)
          index += 1
          runStage()
        }
      }, 60)

      timers.current.push(tick as unknown as ReturnType<typeof setTimeout>)
    }

    runStage()

    return () => {
      cancelled = true
      timers.current.forEach((t) => clearInterval(t as unknown as number))
      timers.current = []
    }
  }, [total])

  const overall = useMemo(() => {
    if (finished) return 100
    return Math.round(((stageIndex + stageProgress / 100) / total) * 100)
  }, [finished, stageIndex, stageProgress, total])

  const visibleLogs = useMemo(() => {
    const lines: { text: string; stage: string }[] = []
    processingStages.forEach((stage, i) => {
      if (i < stageIndex || finished) {
        stage.logs.forEach((text) => lines.push({ text, stage: stage.title }))
      } else if (i === stageIndex) {
        const shown = Math.ceil((stageProgress / 100) * stage.logs.length)
        stage.logs.slice(0, shown).forEach((text) => lines.push({ text, stage: stage.title }))
      }
    })
    return lines
  }, [stageIndex, stageProgress, finished])

  const stepItems = processingStages.map((stage, i) => {
    const done = finished || i < stageIndex
    const active = !finished && i === stageIndex
    const isWarningStage = stage.status === "warning" && done

    return {
      title: stage.title,
      description: (
        <Text type="secondary" style={{ fontSize: 12.5 }}>
          {stage.description}
        </Text>
      ),
      status: done ? ("finish" as const) : active ? ("process" as const) : ("wait" as const),
      icon: active ? (
        <LoadingOutlined style={{ color: "var(--accent)" }} />
      ) : isWarningStage ? (
        <WarningFilled style={{ color: "var(--caution)" }} />
      ) : done ? (
        <CheckCircleFilled style={{ color: "var(--good)" }} />
      ) : undefined,
    }
  })

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={14}>
        <Card
          title="Processing"
          extra={
            finished ? (
              <Tag color="green" variant="filled" style={{ marginInlineEnd: 0 }}>
                Completed with review flags
              </Tag>
            ) : (
              <Tag color="blue" variant="filled" style={{ marginInlineEnd: 0 }}>
                In progress
              </Tag>
            )
          }
        >
          <Flex align="center" gap={20} wrap style={{ marginBottom: 24 }}>
            <Progress
              type="circle"
              percent={overall}
              size={92}
              strokeColor={finished ? "var(--good)" : "var(--accent)"}
              status={finished ? "success" : "active"}
            />
            <div style={{ flex: "1 1 220px", minWidth: 200 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                {finished ? "Analysis ready" : `Stage ${Math.min(stageIndex + 1, total)} of ${total}`}
              </div>
              <Title level={4} style={{ margin: "0 0 4px", fontSize: 17 }}>
                {finished ? "Extraction and analysis complete" : processingStages[stageIndex]?.title}
              </Title>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
                {finished
                  ? "17 of 19 target fields extracted. 3 items require manual review before the figures are relied on."
                  : processingStages[stageIndex]?.description}
              </Paragraph>
            </div>
          </Flex>

          <Steps
            direction="vertical"
            size="small"
            current={finished ? total : stageIndex}
            items={stepItems}
            aria-label="Extraction pipeline progress"
          />

          <Flex gap={10} justify="flex-end" style={{ marginTop: 20 }}>
            <Button onClick={onCancel}>{finished ? "Start over" : "Cancel"}</Button>
            <Button type="primary" size="large" disabled={!finished} onClick={onComplete}>
              Open analysis dashboard
            </Button>
          </Flex>
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

          {finished && (
            <Alert
              type="warning"
              showIcon
              message="3 items need manual review"
              description="One value conflicts across the two documents, one scanned table returned low OCR confidence, and one field is not disclosed in the source. No figure was substituted in any of these cases."
            />
          )}
        </Flex>
      </Col>
    </Row>
  )
}
