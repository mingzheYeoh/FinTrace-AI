"use client"

import { Button, Card, Divider, Flex, Progress, Tag, Tooltip, Typography } from "antd"
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons"
import { caseSummary } from "@/lib/mock-data"

const { Text, Title } = Typography

export function CaseHeader({ onReset }: { onReset: () => void }) {
  const coverage = Math.round((caseSummary.fieldsExtracted / caseSummary.fieldsTargeted) * 100)

  return (
    <Card className="panel case-header">
      <Flex justify="space-between" align="flex-start" gap={24} wrap>
        <Flex vertical gap={10} style={{ minWidth: 280 }}>
          <Flex align="center" gap={10} wrap>
            <Title level={4} style={{ margin: 0 }}>
              {caseSummary.company}
            </Title>
            <Tag variant="filled" className="rule-tag">
              {caseSummary.id}
            </Tag>
          </Flex>
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            Reg. {caseSummary.registrationId} · Statements to {caseSummary.statementDate} · All figures in{" "}
            {caseSummary.currency} {caseSummary.unitScale}
          </Text>
          <Flex gap={8} wrap>
            {caseSummary.documents.map((doc) => (
              <Tooltip key={doc.id} title={`${doc.sizeLabel} · ${doc.pageOrSheetCount} ${doc.kind === "pdf" ? "pages" : "sheets"}`}>
                <Tag
                  variant="filled"
                  className="doc-chip"
                  icon={doc.kind === "pdf" ? <FilePdfOutlined /> : <FileExcelOutlined />}
                >
                  {doc.name}
                </Tag>
              </Tooltip>
            ))}
          </Flex>
        </Flex>

        <Flex align="stretch" gap={0} className="case-metrics">
          <Flex vertical gap={4} className="case-metric">
            <Text type="secondary" style={{ fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Comparison
            </Text>
            <Text strong className="numeric" style={{ fontSize: 15 }}>
              {caseSummary.currentPeriod} vs {caseSummary.priorPeriod}
            </Text>
          </Flex>

          <Divider orientation="vertical" style={{ height: "auto", marginInline: 20 }} />

          <Flex vertical gap={4} className="case-metric">
            <Text type="secondary" style={{ fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Extraction coverage
            </Text>
            <Flex align="center" gap={10}>
              <Text strong className="numeric" style={{ fontSize: 15 }}>
                {caseSummary.fieldsExtracted}/{caseSummary.fieldsTargeted}
              </Text>
              <Progress
                percent={coverage}
                size="small"
                showInfo={false}
                strokeColor="var(--accent)"
                style={{ width: 72, marginBottom: 0 }}
              />
            </Flex>
          </Flex>

          <Divider orientation="vertical" style={{ height: "auto", marginInline: 20 }} />

          <Flex vertical gap={4} className="case-metric">
            <Text type="secondary" style={{ fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Manual review
            </Text>
            <Flex align="center" gap={6}>
              <WarningOutlined style={{ color: "var(--caution)" }} />
              <Text strong className="numeric" style={{ fontSize: 15 }}>
                {caseSummary.manualReviewCount} fields
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Button icon={<ReloadOutlined />} onClick={onReset}>
          New analysis
        </Button>
      </Flex>
    </Card>
  )
}
