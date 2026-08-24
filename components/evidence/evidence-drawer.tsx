"use client"

import { useMemo } from "react"
import { Alert, Descriptions, Divider, Drawer, Empty, Flex, Skeleton, Space, Tag, Typography } from "antd"
import {
  CalculatorOutlined,
  FileTextOutlined,
  RobotOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import type { Calculation, FinancialField, FinancialPeriodValue, SourceLocation } from "@/src/lib/api/client"
import { useAnalysisResult } from "@/src/features/analysis/queries"
import { useEvidenceDetail } from "@/src/features/evidence/queries"
import { toNumber } from "@/src/features/analysis/present"
import { confidenceMeta, formatCurrency, formatNumber, statusMeta } from "@/lib/format"
import { useEvidence } from "./evidence-context"

const { Text, Paragraph, Title } = Typography

const SECTION_TITLE = {
  fontSize: 12,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
  color: "var(--ink-faint)",
  marginBottom: 10,
}

function SourceBlock({ source }: { source: SourceLocation }) {
  return (
    <>
      <Descriptions
        size="small"
        column={1}
        bordered
        items={[
          {
            key: "raw",
            label: "Raw source value",
            children: <span className="numeric">{source.raw_value}</span>,
          },
          {
            key: "document",
            label: "Source document",
            children: (
              <Space size={6}>
                <FileTextOutlined style={{ color: "var(--ink-faint)" }} />
                <span className="numeric" style={{ fontSize: 12.5 }}>
                  {source.document_name}
                </span>
              </Space>
            ),
          },
          {
            key: "locator",
            label: "Evidence location",
            children: <Text style={{ fontSize: 13 }}>{source.locator}</Text>,
          },
        ]}
      />
      <div style={{ marginTop: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          Source excerpt
        </div>
        <div className="evidence-quote">{source.excerpt}</div>
      </div>
    </>
  )
}

function PeriodBlock({ value, statusLabel }: { value: FinancialPeriodValue; statusLabel: string }) {
  const parsed = toNumber(value.value)

  return (
    <div style={{ marginTop: 14 }}>
      <Flex align="baseline" gap={8} style={{ marginBottom: 8 }}>
        <div className="eyebrow">{value.period}</div>
        {parsed === null ? (
          <Text type="secondary" italic style={{ fontSize: 13 }}>
            No value — {statusLabel.toLowerCase()}
          </Text>
        ) : (
          <span className="numeric" style={{ fontWeight: 600, fontSize: 14 }}>
            {formatCurrency(parsed, value.currency)}{" "}
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({value.unit_scale})
            </Text>
          </span>
        )}
      </Flex>

      {value.sources.length > 0 ? (
        <SourceBlock source={value.sources[0]} />
      ) : (
        <Text type="secondary" style={{ fontSize: 12.5 }}>
          No source location was recorded for this period.
        </Text>
      )}
    </div>
  )
}

function FieldBlock({ field }: { field: FinancialField }) {
  const status = statusMeta[field.status]
  const confidence = confidenceMeta[field.confidence]

  return (
    <div style={{ border: "1px solid var(--rule-soft)", borderRadius: 4, padding: 16, background: "#fff" }}>
      <Flex justify="space-between" align="flex-start" gap={12} wrap>
        <Text strong style={{ fontSize: 14 }}>
          {field.label}
        </Text>
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

      <PeriodBlock value={field.current} statusLabel={status.label} />
      <PeriodBlock value={field.prior} statusLabel={status.label} />

      {field.conflict && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginTop: 14 }}
          title="A second source reports a different value"
          description={
            <div>
              <div style={{ marginBottom: 8 }}>
                <span className="numeric" style={{ fontWeight: 600 }}>
                  {formatCurrency(toNumber(field.conflict.value) ?? 0, field.current.currency)}
                </span>{" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  · {field.conflict.period} · {field.conflict.source.document_name} ·{" "}
                  {field.conflict.source.locator}
                </Text>
              </div>
              <div className="evidence-quote">{field.conflict.source.excerpt}</div>
              <Paragraph type="secondary" style={{ fontSize: 12.5, marginTop: 8, marginBottom: 0 }}>
                Both values are retained. Neither was overwritten or merged.
              </Paragraph>
            </div>
          }
        />
      )}

      {field.note && (
        <Paragraph type="secondary" style={{ fontSize: 12.5, marginTop: 12, marginBottom: 0 }}>
          {field.note}
        </Paragraph>
      )}
    </div>
  )
}

function CalculationBlock({ calc }: { calc: Calculation }) {
  const result = toNumber(calc.result)
  const suffix = calc.unit === "percentage" ? "%" : calc.unit === "ratio" ? "x" : ""
  const rendered =
    result === null
      ? "Not calculable"
      : calc.unit === "currency"
        ? formatCurrency(result)
        : `${formatNumber(result, 2)}${suffix}`

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
  const { open, request, analysisId, closeEvidence } = useEvidence()

  const detailQuery = useEvidenceDetail(analysisId, request?.evidenceId ?? null, open)
  // The result is already cached from the dashboard; this resolves ids to records.
  const resultQuery = useAnalysisResult(analysisId, true)

  const detail = detailQuery.data
  const result = resultQuery.data

  const { fields, calculations } = useMemo(() => {
    if (!detail || !result) return { fields: [] as FinancialField[], calculations: [] as Calculation[] }

    const fieldById = new Map(result.fields.map((f) => [f.id, f]))
    const calcById = new Map(result.calculations.map((c) => [c.id, c]))

    return {
      fields: detail.fact_ids.map((id) => fieldById.get(id)).filter((f): f is FinancialField => Boolean(f)),
      calculations: detail.calculation_ids
        .map((id) => calcById.get(id))
        .filter((c): c is Calculation => Boolean(c)),
    }
  }, [detail, result])

  const isLoading = detailQuery.isPending || resultQuery.isPending
  const isEmpty = !isLoading && fields.length === 0 && calculations.length === 0

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
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>
            {detail?.title ?? request?.fallbackTitle ?? "Evidence"}
          </div>
        </div>
      }
      styles={{ body: { background: "var(--shell)", paddingTop: 16 } }}
      destroyOnHidden={false}
    >
      {detailQuery.isError ? (
        <Alert
          type="error"
          showIcon
          title="The evidence trail could not be loaded"
          description="The request for this evidence record failed. Nothing is inferred in its place — close the drawer and try again."
        />
      ) : isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          {detail?.subtitle && (
            <Paragraph type="secondary" style={{ fontSize: 13, marginTop: -4 }}>
              {detail.subtitle}
            </Paragraph>
          )}

          {isEmpty ? (
            <Empty description="No linked evidence for this item" style={{ marginTop: 48 }} />
          ) : (
            <Flex vertical gap={16}>
              {calculations.length > 0 && (
                <section aria-label="Deterministic calculations">
                  <Title level={5} style={SECTION_TITLE}>
                    Deterministic calculations ({calculations.length})
                  </Title>
                  <Flex vertical gap={12}>
                    {calculations.map((calc) => (
                      <CalculationBlock key={calc.id} calc={calc} />
                    ))}
                  </Flex>
                </section>
              )}

              {fields.length > 0 && (
                <section aria-label="Extracted source facts">
                  <Title level={5} style={SECTION_TITLE}>
                    Extracted source facts ({fields.length})
                  </Title>
                  <Flex vertical gap={12}>
                    {fields.map((field) => (
                      <FieldBlock key={field.id} field={field} />
                    ))}
                  </Flex>
                </section>
              )}

              {detail?.narrative && (
                <section aria-label="AI generated interpretation">
                  <Title level={5} style={SECTION_TITLE}>
                    AI interpretation
                  </Title>
                  <div
                    style={{
                      border: "1px dashed var(--rule)",
                      borderRadius: 4,
                      padding: 16,
                      background: "var(--accent-wash)",
                    }}
                  >
                    <Space size={8} align="start">
                      <RobotOutlined style={{ color: "var(--accent)", marginTop: 3 }} />
                      <div>
                        <Paragraph style={{ fontSize: 13.5, marginBottom: 8 }}>{detail.narrative}</Paragraph>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Language-model narrative. It describes the facts and calculations above and introduces
                          no new figures.
                        </Text>
                      </div>
                    </Space>
                  </div>
                </section>
              )}

              {detail?.follow_up && (
                <section aria-label="Suggested follow up">
                  <Title level={5} style={SECTION_TITLE}>
                    Suggested follow-up
                  </Title>
                  <div
                    style={{ border: "1px solid var(--rule-soft)", borderRadius: 4, padding: 16, background: "#fff" }}
                  >
                    <Space size={8} align="start">
                      <QuestionCircleOutlined style={{ color: "var(--accent)", marginTop: 3 }} />
                      <Text style={{ fontSize: 13.5 }}>{detail.follow_up}</Text>
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
        </>
      )}
    </Drawer>
  )
}
