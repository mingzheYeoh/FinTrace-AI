"use client"

import { Badge, Button, Card, Flex, Space, Tag, Typography } from "antd"
import { AlertOutlined, ArrowRightOutlined, FileSearchOutlined } from "@ant-design/icons"
import { severityMeta } from "@/lib/format"
import { useEvidence } from "@/components/evidence/evidence-context"
import type { Anomaly } from "@/src/lib/api/client"

const { Text, Paragraph } = Typography

function AnomalyRow({ anomaly }: { anomaly: Anomaly }) {
  const { openEvidence } = useEvidence()
  const meta = severityMeta[anomaly.severity]

  return (
    <div className="anomaly-row" data-severity={anomaly.severity}>
      <Flex align="flex-start" gap={12}>
        <span className="anomaly-rail" aria-hidden />
        <Flex vertical gap={8} flex={1}>
          <Flex align="center" gap={8} wrap>
            <Text strong style={{ fontSize: 14 }}>
              {anomaly.title}
            </Text>
            <Tag color={meta.color} variant="filled" style={{ marginInlineEnd: 0 }}>
              {meta.label}
            </Tag>
            <Tag variant="filled" style={{ marginInlineEnd: 0 }} className="rule-tag">
              {anomaly.rule_id}
            </Tag>
            {anomaly.requires_manual_review ? (
              <Tag color="gold" variant="filled" style={{ marginInlineEnd: 0 }}>
                Manual review
              </Tag>
            ) : null}
          </Flex>

          <Paragraph style={{ marginBottom: 0, fontSize: 13 }} type="secondary">
            {anomaly.detail}
          </Paragraph>

          <Flex align="center" gap={8} className="anomaly-followup">
            <ArrowRightOutlined style={{ fontSize: 11, opacity: 0.6 }} />
            <Text style={{ fontSize: 12.5 }} italic>
              {anomaly.follow_up}
            </Text>
          </Flex>

          <div>
            <Button
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() =>
                openEvidence({ evidenceId: anomaly.evidence_id, fallbackTitle: anomaly.title })
              }
            >
              Trace evidence
            </Button>
          </div>
        </Flex>
      </Flex>
    </div>
  )
}

export function AnomalyPanel({ anomalies }: { anomalies: Anomaly[] }) {
  const highCount = anomalies.filter((a) => a.severity === "high").length

  return (
    <Card
      className="panel"
      title={
        <Flex align="center" gap={8}>
          <AlertOutlined style={{ color: "var(--alert)" }} />
          <span>Anomaly alerts</span>
          <Badge count={anomalies.length} color="var(--ink-soft)" />
        </Flex>
      }
      extra={
        highCount > 0 ? (
          <Text type="danger" style={{ fontSize: 12, fontWeight: 600 }}>
            {highCount} high severity
          </Text>
        ) : null
      }
    >
      <Space orientation="vertical" size={0} style={{ width: "100%" }}>
        {anomalies.map((anomaly) => (
          <AnomalyRow key={anomaly.id} anomaly={anomaly} />
        ))}
      </Space>
    </Card>
  )
}
