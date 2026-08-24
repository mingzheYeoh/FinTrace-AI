"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Card, Col, Row, Segmented, Skeleton, Space, Tag, Typography } from "antd"
import type { TrendPoint } from "@/src/lib/api/client"
import { toNumber } from "@/src/features/analysis/present"
import { chartPalette } from "@/lib/theme"
import { formatNumber, formatPercent } from "@/lib/format"

const { Text } = Typography

// Charts render to canvas — load them on the client only.
const Line = dynamic(() => import("@ant-design/charts").then((m) => m.Line), {
  ssr: false,
  loading: () => <Skeleton active paragraph={{ rows: 6 }} style={{ padding: 8 }} />,
})

const Column = dynamic(() => import("@ant-design/charts").then((m) => m.Column), {
  ssr: false,
  loading: () => <Skeleton active paragraph={{ rows: 6 }} style={{ padding: 8 }} />,
})

const AXIS_STYLE = {
  labelFontSize: 11,
  labelFill: "#7d8d94",
  labelFontFamily: "var(--font-numeric)",
  line: false as const,
  tickStroke: "#dfe4e6",
}

type Mode = "absolute" | "margin"

/**
 * The one currency metric an order of magnitude above the others. Kept as a
 * named constant so the axis-splitting rationale below stays legible.
 */
const HEADLINE_METRIC = "Revenue"

/** Chart-ready point: the contract carries decimal strings, Ant charts need numbers. */
type PlotPoint = { period: string; metric: string; value: number }

type Props = {
  trends: TrendPoint[]
}

export function TrendCharts({ trends }: Props) {
  const [mode, setMode] = useState<Mode>("absolute")

  const { headline, secondary, margins, periods, divergence } = useMemo(() => {
    const plot = (points: TrendPoint[]): PlotPoint[] =>
      points
        .map((p) => ({ period: p.period, metric: p.metric, value: toNumber(p.value) }))
        .filter((p): p is PlotPoint => p.value !== null)

    const currency = trends.filter((t) => t.format === "currency")
    const margins = plot(trends.filter((t) => t.format === "percentage"))
    const periods = [...new Set(trends.map((t) => t.period))].sort()

    const headline = plot(currency.filter((t) => t.metric === HEADLINE_METRIC))
    const secondary = plot(currency.filter((t) => t.metric !== HEADLINE_METRIC))

    /**
     * Derived from the series rather than restated as literals, so the panel
     * cannot drift out of step with the data it summarises.
     */
    const latest = periods.at(-1)
    const previous = periods.at(-2)
    const currencyPlot = plot(currency)
    const divergence = [...new Set(currencyPlot.map((p) => p.metric))].map((metric) => {
      const now = currencyPlot.find((p) => p.metric === metric && p.period === latest)?.value ?? null
      const before = currencyPlot.find((p) => p.metric === metric && p.period === previous)?.value ?? null
      const crossedZero = now !== null && before !== null && now < 0 && before >= 0
      const delta = now !== null && before !== null && before !== 0 ? ((now - before) / Math.abs(before)) * 100 : null
      return { metric, now, delta, crossedZero }
    })

    return { headline, secondary, margins, periods, divergence }
  }, [trends])

  const secondaryMetrics = [...new Set(secondary.map((p) => p.metric))]

  /**
   * Revenue is an order of magnitude larger than profit and cash flow, so a
   * shared linear axis would flatten exactly the divergence this chart exists
   * to show. Revenue gets its own panel; profit and cash flow share a second
   * panel where a zero crossing is legible.
   */
  const revenueConfig = {
    data: headline,
    xField: "period",
    yField: "value",
    colorField: "metric",
    height: 168,
    scale: { color: { range: [chartPalette[0]] } },
    axis: {
      x: { ...AXIS_STYLE, title: null },
      y: {
        ...AXIS_STYLE,
        title: null,
        tickCount: 4,
        labelFormatter: (v: number) => formatNumber(v / 1000, 0) + "m",
      },
    },
    point: { size: 4, style: { lineWidth: 1, fillOpacity: 1 } },
    style: { lineWidth: 2 },
    legend: false as const,
    tooltip: {
      title: (d: PlotPoint) => d.period,
      items: [{ channel: "y" as const, valueFormatter: (v: number) => `MYR ${formatNumber(v)}k` }],
    },
    interaction: { tooltip: { marker: true } },
  }

  const earningsConfig = {
    data: secondary,
    xField: "period",
    yField: "value",
    colorField: "metric",
    height: 190,
    scale: { color: { range: [chartPalette[1], chartPalette[2]] } },
    axis: {
      x: { ...AXIS_STYLE, title: null },
      y: {
        ...AXIS_STYLE,
        title: null,
        tickCount: 5,
        labelFormatter: (v: number) => formatNumber(v / 1000, 1) + "m",
      },
    },
    // Mark where operating cash flow crosses zero.
    annotations: [
      {
        type: "lineY",
        data: [0],
        style: { stroke: "#b3323c", strokeOpacity: 0.5, lineWidth: 1, lineDash: [3, 3] },
      },
    ],
    point: { size: 4, style: { lineWidth: 1, fillOpacity: 1 } },
    style: { lineWidth: 2 },
    legend: {
      color: {
        position: "top" as const,
        layout: { justifyContent: "flex-start" as const },
        itemLabelFontSize: 12,
        itemLabelFill: "#4a5b63",
      },
    },
    tooltip: {
      title: (d: PlotPoint) => d.period,
      items: [{ channel: "y" as const, valueFormatter: (v: number) => `MYR ${formatNumber(v)}k` }],
    },
    interaction: { tooltip: { marker: true } },
  }

  const marginConfig = {
    data: margins,
    xField: "period",
    yField: "value",
    colorField: "metric",
    height: 300,
    group: true,
    scale: { color: { range: [chartPalette[0], chartPalette[3]] } },
    axis: {
      x: { ...AXIS_STYLE, title: null },
      y: { ...AXIS_STYLE, title: null, labelFormatter: (v: number) => `${v}%` },
    },
    style: { radiusTopLeft: 2, radiusTopRight: 2, maxWidth: 26 },
    legend: {
      color: {
        position: "top" as const,
        layout: { justifyContent: "flex-start" as const },
        itemLabelFontSize: 12,
        itemLabelFill: "#4a5b63",
      },
    },
    tooltip: {
      title: (d: PlotPoint) => d.period,
      items: [{ channel: "y" as const, valueFormatter: (v: number) => `${formatNumber(v, 2)}%` }],
    },
    interaction: { elementHighlight: { background: true } },
  }

  const latestPeriod = periods.at(-1) ?? ""

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={16}>
        <Card
          title={`${periods.length}-period trend`}
          extra={
            <Segmented<Mode>
              size="small"
              value={mode}
              onChange={setMode}
              options={[
                { label: "Absolute", value: "absolute" },
                { label: "Margins", value: "margin" },
              ]}
            />
          }
        >
          <div style={{ marginBottom: 10 }}>
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              {mode === "absolute"
                ? `Revenue continued rising through ${latestPeriod} while ${secondaryMetrics
                    .join(" and ")
                    .toLowerCase()} diverged sharply. The dashed line marks zero.`
                : "Gross and net margin have both compressed, with the steepest fall in the latest period."}
            </Text>
          </div>
          {mode === "absolute" ? (
            <div>
              <div className="eyebrow" style={{ marginBottom: 2 }}>
                {HEADLINE_METRIC} · MYR
              </div>
              <Line {...revenueConfig} />
              <div className="eyebrow" style={{ margin: "10px 0 2px" }}>
                {secondaryMetrics.join(" and ")} · MYR
              </div>
              <Line {...earningsConfig} />
            </div>
          ) : (
            <Column {...marginConfig} />
          )}
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title={`Divergence in ${latestPeriod}`} style={{ height: "100%" }}>
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            {divergence.map((row) => {
              const negative = row.crossedZero || (row.delta !== null && row.delta < 0)
              return (
                <div key={row.metric} style={{ borderBottom: "1px solid var(--rule-soft)", paddingBottom: 12 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>
                    {row.metric}
                  </div>
                  <Space align="baseline" size={8}>
                    <span
                      className="numeric"
                      style={{
                        fontSize: 19,
                        fontWeight: 600,
                        color: negative ? "var(--alert)" : "var(--good)",
                      }}
                    >
                      {/* formatPercent already carries the sign. */}
                      {row.delta === null ? "n/a" : formatPercent(row.delta)}
                    </span>
                    {row.now !== null && (
                      <Text type="secondary" className="numeric" style={{ fontSize: 12.5 }}>
                        {formatNumber(row.now)}k
                      </Text>
                    )}
                  </Space>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12.5 }}>
                      {row.crossedZero
                        ? "Crossed from positive to negative"
                        : row.delta !== null && row.delta > 0
                          ? "Higher than the prior period"
                          : "Lower than the prior period"}
                    </Text>
                  </div>
                </div>
              )
            })}
            <Tag
              color="orange"
              variant="filled"
              style={{ marginInlineEnd: 0, whiteSpace: "normal", height: "auto", padding: "6px 8px" }}
            >
              Growth in {latestPeriod} was funded externally rather than by trading cash.
            </Tag>
          </Space>
        </Card>
      </Col>
    </Row>
  )
}
