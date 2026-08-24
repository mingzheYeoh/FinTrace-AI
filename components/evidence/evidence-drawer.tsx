"use client"

import { Alert, Descriptions, Divider, Drawer, Empty, Flex, Space, Tag, Typography } from "antd"
import {
  CalculatorOutlined,
  FileTextOutlined,
  RobotOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import { calculationsFor, factsFor } from "@/lib/mock-data"
import { confidenceMeta, formatCurrency, formatNumber, statusMeta } from "@/lib/format"
import type { Calculation, FinancialFact } from "@/lib/types"
import { useEvidence } from "./evidence-context"

const { Text, Paragraph, Title } = Typography

function FactBlock({ fact }: { fact: FinancialFact }) {
  const status = statusMeta[fact.status]
  const confidence = confidenceMeta[fact.confidence]
  const unavailable = fact.value === null

  return (
    <div style={{ border: "1px solid var(--rule-soft)", borderRadius: 4, padding: 16, background: "#fff" }}>
      <Flex justify="space-between" align="flex-start" gap={12} wrap>
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {fact.label}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, marginInlineStart: 8 }}>
            {fact.period}
          </Text>
        </div>
        <Space size={4} wrap>
          <Tag color={status.color} variant="filled">
            {status.label}
          </Tag>
          <Tag color={confidence.color} variant="outlined">
            {confidence.label}
          </Tag>
        </Space>
      </Flex>

      <Divider style={{ margin: "12px 0" }} />

      <Descriptions
        size="small"
        column={1}
        bordered
        items={[
          {
            key: "normalized",
            label: "Normalized value",
            children: unavailable ? (
              <Text type="secondary" italic>
                No value — {status.label.toLowerCase()}
              </Text>
            ) : (
              <span className="numeric">
                {formatCurrency(fact.value as number, fact.currency)}{" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({fact.unitScale})
                </Text>
              </span>
            ),
          },
          ...(fact.evidence.length
            ? [
                {
                  key: "raw",
                  label: "Raw source value",
                  children: <span className="numeric">{fact.evidence[0].rawValue}</span>,
                },
                {
                  key: "document",
                  label: "Source document",
                  children: (
                    <Space size={6}>
                      <FileTextOutlined style={{ color: "var(--ink-faint)" }} />
                      <span className="numeric" style={{ fontSize: 12.5 }}>
                        {fact.evidence[0].document}
                      </span>
                    </Space>
                  ),
                },
                {
                  key: "locator",
                  label: "Evidence location",
                  children: <Text style={{ fontSize: 13 }}>{fact.evidence[0].locator}</Text>,
                },
              ]
            : []),
        ]}
      />

      {fact.evidence.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Source excerpt
          </div>
          <div className="evidence-quote">{fact.evidence[0].excerpt}</div>
        </div>
      )}

      {fact.conflictWith && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginTop: 12 }}
          title="A second source reports a different value"
          description={
            <div>
              <div style={{ marginBottom: 8 }}>
                <span className="numeric" style={{ fontWeight: 600 }}>
                  {formatCurrency(fact.conflictWith.value, fact.currency)}
                </span>{" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  · {fact.conflictWith.evidence.document} · {fact.conflictWith.evidence.locator}
                </Text>
              </div>
              <div className="evidence-quote">{fact.conflictWith.evidence.excerpt}</div>
              <Paragraph type="secondary" style={{ fontSize: 12.5, marginTop: 8, marginBottom: 0 }}>
                Both values are retained. Neither was overwritten or merged.
              </Paragraph>
            </div>
          }
        />
      )}

      {fact.note && (
        <Paragraph type="secondary" style={{ fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>
          {fact.note}
        </Paragraph>
      )}
    </div>
  )
}

function unitSuffix(calc: Calculation) {
  if (calc.unit === "%") return "%"
  if (calc.unit === "x") return "x"
  return ""
}

function CalculationBlock({ calc }: { calc: Calculation }) {
  const rendered =
    calc.unit === "currency" ? formatCurrency(calc.result) : `${formatNumber(calc.result, 2)}${unitSuffix(calc)}`

  return (
    <div style={{ border: "1px solid var(--rule-soft)", borderRadius: 4, padding: 16, background: "#fff" }}>
      <Flex justify="space-between" align="center" gap={12} wrap>
        <Space size={8}>
          <CalculatorOutlined style={{ color: "var(--accent)" }} />
          <Text strong style={{ fontSize: 14 }}>
            {calc.label}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {calc.period}
          </Text>
        </Space>
        <Tag color="cyan" variant="filled" className="numeric">
          {rendered}
        </Tag>
      </Flex>

      <Divider style={{ margin: "12px 0" }} />

      <div className="eyebrow" style={{ marginBottom: 6 }}>
        Formula
      </div>
      <div className="evidence-quote">{calc.formula}</div>

      <div className="eyebrow" style={{ margin: "12px 0 6px" }}>
        Applied to source values
      </div>
      <div className="evidence-quote">
        {calc.substitution} = {rendered}
      </div>

      <Paragraph type="secondary" style={{ fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>
        Computed in application code from stored normalized values. Not produced by a language model.
      </Paragraph>
    </div>
  )
}

export function EvidenceDrawer() {
  const { open, request, closeEvidence } = useEvidence()

  const factList = request ? factsFor(request.factIds) : []
  const calcList = request ? calculationsFor(request.calculationIds) : []
  const isEmpty = factList.length === 0 && calcList.length === 0

  return (
    <Drawer
      open={open}
      onClose={closeEvidence}
      size={620}
      title={
        <div>
          <div className="eyebrow" style={{ marginBottom: 2 }}>
            Source evidence
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{request?.title ?? "Evidence"}</div>
        </div>
      }
      styles={{ body: { background: "var(--shell)", paddingTop: 16 } }}
      destroyOnHidden={false}
    >
      {request?.subtitle && (
        <Paragraph type="secondary" style={{ fontSize: 13, marginTop: -4 }}>
          {request.subtitle}
        </Paragraph>
      )}

      {isEmpty ? (
        <Empty description="No linked evidence for this item" style={{ marginTop: 48 }} />
      ) : (
        <Flex vertical gap={16}>
          {calcList.length > 0 && (
            <section aria-label="Deterministic calculations">
              <Title level={5} style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
                Deterministic calculations ({calcList.length})
              </Title>
              <Flex vertical gap={12}>
                {calcList.map((calc) => (
                  <CalculationBlock key={calc.id} calc={calc} />
                ))}
              </Flex>
            </section>
          )}

          {factList.length > 0 && (
            <section aria-label="Extracted source facts">
              <Title level={5} style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
                Extracted source facts ({factList.length})
              </Title>
              <Flex vertical gap={12}>
                {factList.map((fact) => (
                  <FactBlock key={fact.id} fact={fact} />
                ))}
              </Flex>
            </section>
          )}

          {request?.narrative && (
            <section aria-label="AI generated interpretation">
              <Title level={5} style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
                AI interpretation
              </Title>
              <div style={{ border: "1px dashed var(--rule)", borderRadius: 4, padding: 16, background: "var(--accent-wash)" }}>
                <Space size={8} align="start">
                  <RobotOutlined style={{ color: "var(--accent)", marginTop: 3 }} />
                  <div>
                    <Paragraph style={{ fontSize: 13.5, marginBottom: 8 }}>{request.narrative}</Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Language-model narrative. It describes the facts and calculations above and introduces no new figures.
                    </Text>
                  </div>
                </Space>
              </div>
            </section>
          )}

          {request?.followUp && (
            <section aria-label="Suggested follow up">
              <Title level={5} style={{ fontSize: 12, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>
                Suggested follow-up
              </Title>
              <div style={{ border: "1px solid var(--rule-soft)", borderRadius: 4, padding: 16, background: "#fff" }}>
                <Space size={8} align="start">
                  <QuestionCircleOutlined style={{ color: "var(--accent)", marginTop: 3 }} />
                  <Text style={{ fontSize: 13.5 }}>{request.followUp}</Text>
                </Space>
              </div>
            </section>
          )}

          <Alert
            type="info"
            showIcon
            title="Decision-support observation"
            description="These figures and observations support review. They are not an audit finding, a solvency conclusion or investment advice."
          />
        </Flex>
      )}
    </Drawer>
  )
}
