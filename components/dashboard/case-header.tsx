"use client"

import { Button, Card, Divider, Flex, Progress, Tag, Tooltip, Typography } from "antd"
import {
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import type { AnalysisSummary } from "@/src/lib/api/client"

const { Text, Title } = Typography

const docIcon = {
  pdf: <FilePdfOutlined />,
  xlsx: <FileExcelOutlined />,
  csv: <FileTextOutlined />,
}

interface CaseHeaderProps {
  summary: AnalysisSummary
  onReset: () => void
}

export function CaseHeader({ summary, onReset }: CaseHeaderProps) {
  const { extraction_summary: extraction } = summary
  const coverage = Math.round((extraction.extracted_fields / extraction.targeted_fields) * 100)

  return (
    <Card className="panel case-header">
      <Flex justify="space-between" align="flex-start" gap={24} wrap>
        <Flex vertical gap={10} style={{ minWidth: 280 }}>
          <Flex align="center" gap={10} wrap>
            <Title level={4} style={{ margin: 0 }}>
              {summary.company}
            </Title>
            <Tag variant="filled" className="rule-tag">
              {summary.analysis_id}
            </Tag>
          </Flex>
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            Reg. {summary.registration_id} · Statements to {summary.statement_date} · All figures in{" "}
            {summary.currency} {summary.unit_scale}
          </Text>
          <Flex gap={8} wrap>
            {summary.documents.map((doc) => (
              <Tooltip
                key={doc.id}
                title={`${doc.size_label} · ${doc.page_or_sheet_count} ${doc.kind === "pdf" ? "pages" : "sheets"}`}
              >
                <Tag variant="filled" className="doc-chip" icon={docIcon[doc.kind]}>
                  {doc.name}
                </Tag>
              </Tooltip>
            ))}
          </Flex>
        </Flex>

        <Flex align="stretch" gap={16} wrap className="case-metrics">
          <Flex vertical gap={4} className="case-metric">
            <Text type="secondary" style={{ fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Comparison
            </Text>
            <Text strong className="numeric" style={{ fontSize: 15 }}>
              {summary.current_period} vs {summary.prior_period}
            </Text>
          </Flex>

          <Divider orientation="vertical" style={{ height: "auto", marginInline: 4 }} />

          <Flex vertical gap={4} className="case-metric">
            <Text type="secondary" style={{ fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Extraction coverage
            </Text>
            <Flex align="center" gap={10}>
              <Text strong className="numeric" style={{ fontSize: 15 }}>
                {extraction.extracted_fields}/{extraction.targeted_fields}
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

          <Divider orientation="vertical" style={{ height: "auto", marginInline: 4 }} />

          <Flex vertical gap={4} className="case-metric">
            <Text type="secondary" style={{ fontSize: 11.5, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Manual review
            </Text>
            <Flex align="center" gap={6}>
              <WarningOutlined style={{ color: "var(--caution)" }} />
              <Text strong className="numeric" style={{ fontSize: 15 }}>
                {extraction.manual_review_count} fields
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
