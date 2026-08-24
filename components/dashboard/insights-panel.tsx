"use client"

import { Alert, Button, Card, Flex, Space, Tag, Typography } from "antd"
import { BulbOutlined, FileSearchOutlined, QuestionCircleOutlined } from "@ant-design/icons"
import { followUpQuestions, insights } from "@/lib/mock-data"
import { useEvidence } from "@/components/evidence/evidence-context"

const { Text, Paragraph } = Typography

const toneMeta = {
  concern: { label: "Concern", color: "red" },
  strength: { label: "Strength", color: "green" },
  neutral: { label: "Observation", color: "default" },
} as const

export function InsightsPanel() {
  const { openEvidence } = useEvidence()

  return (
    <Card
      className="panel"
      title={
        <Flex align="center" gap={8}>
          <BulbOutlined style={{ color: "var(--accent)" }} />
          <span>AI interpretation</span>
        </Flex>
      }
      extra={
        <Tag variant="filled" className="rule-tag">
          Generated narrative
        </Tag>
      }
    >
      <Alert
        type="info"
        variant="outlined"
        showIcon
        style={{ marginBottom: 16 }}
        title="Narrative is model-generated"
        description="Every statement below links back to the extracted figures it was derived from. Open the evidence trail to confirm each number against the source document before relying on it."
      />

      <Space orientation="vertical" size={14} style={{ width: "100%" }}>
        {insights.map((insight) => {
          const tone = toneMeta[insight.tone]
          return (
            <div key={insight.id} className="insight-card" data-tone={insight.tone}>
              <Flex vertical gap={8}>
                <Flex align="center" gap={8} wrap>
                  <Text strong style={{ fontSize: 14 }}>
                    {insight.title}
                  </Text>
                  <Tag color={tone.color} variant="filled" style={{ marginInlineEnd: 0 }}>
                    {tone.label}
                  </Tag>
                </Flex>
                <Paragraph style={{ marginBottom: 0, fontSize: 13 }} type="secondary">
                  {insight.narrative}
                </Paragraph>
                <div>
                  <Button
                    size="small"
                    icon={<FileSearchOutlined />}
                    onClick={() =>
                      openEvidence({
                        title: insight.title,
                        subtitle: "AI interpretation traced to source figures",
                        factIds: insight.factIds,
                        calculationIds: insight.calculationIds,
                        narrative: insight.narrative,
                      })
                    }
                  >
                    Trace evidence
                  </Button>
                </div>
              </Flex>
            </div>
          )
        })}
      </Space>

      <div className="followup-block">
        <Flex align="center" gap={8} style={{ marginBottom: 10 }}>
          <QuestionCircleOutlined style={{ color: "var(--ink-soft)" }} />
          <Text strong style={{ fontSize: 13 }}>
            Suggested follow-up questions
          </Text>
        </Flex>
        <Flex vertical gap={7} component="ol" className="plain-list">
          {followUpQuestions.map((question, index) => (
            <Flex key={question} gap={10} align="flex-start" component="li">
              <Text type="secondary" className="numeric" style={{ fontSize: 12, minWidth: 16 }}>
                {index + 1}.
              </Text>
              <Text style={{ fontSize: 12.5 }}>{question}</Text>
            </Flex>
          ))}
        </Flex>
      </div>
    </Card>
  )
}
