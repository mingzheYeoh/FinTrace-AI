"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card, Col, Row, Segmented, Skeleton, Space, Tag, Typography } from "antd"
import { CURRENT_PERIOD, marginTrend, trendSeries } from "@/lib/mock-data"
import { chartPalette } from "@/lib/theme"
import { formatNumber } from "@/lib/format"

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

export function TrendCharts() {
  const [mode, setMode] = useState<Mode>("absolute")

  const absoluteConfig = {
    data: trendSeries,
    xField: "period",
    yField: "value",
    colorField: "metric",
    height: 300,
    scale: { color: { range: chartPalette } },
    axis: {
      x: { ...AXIS_STYLE, title: null },
      y: {
        ...AXIS_STYLE,
        title: null,
        labelFormatter: (v: number) => formatNumber(v / 1000, 0) + "m",
      },
    },
    // Mark where operating cash flow crosses zero.
    annotations: [
      {
        type: "lineY",
        data: [0],
        style: { stroke: "#b3323c", strokeOpacity: 0.45, lineWidth: 1, lineDash: [3, 3] },
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
      title: (d: { period: string }) => d.period,
      items: [
        {
          channel: "y" as const,
          valueFormatter: (v: number) => `MYR ${formatNumber(v)}k`,
        },
      ],
    },
    interaction: { tooltip: { marker: true }, elementHighlight: { background: true } },
  }

  const marginConfig = {
    data: marginTrend,
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
      title: (d: { period: string }) => d.period,
      items: [{ channel: "y" as const, valueFormatter: (v: number) => `${formatNumber(v, 2)}%` }],
    },
    interaction: { elementHighlight: { background: true } },
  }

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} xl={16}>
        <Card
          title="Five-period trend"
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
                ? "Revenue continued rising through FY2025 while net profit and operating cash flow diverged sharply. The dashed line marks zero."
                : "Gross and net margin have both compressed, with the steepest fall in FY2025."}
            </Text>
          </div>
          {mode === "absolute" ? <Line {...absoluteConfig} /> : <Column {...marginConfig} />}
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        <Card title={`Divergence in ${CURRENT_PERIOD}`} style={{ height: "100%" }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {[
              {
                label: "Revenue",
                value: "+11.89%",
                detail: "Fifth consecutive period of growth",
                tone: "good" as const,
              },
              {
                label: "Net profit",
                value: "−37.14%",
                detail: "First decline across the five periods",
                tone: "bad" as const,
              },
              {
                label: "Operating cash flow",
                value: "−10,215k",
                detail: "Crossed from positive to negative",
                tone: "bad" as const,
              },
              {
                label: "Borrowings",
                value: "+43.12%",
                detail: "Debt-to-equity moved 0.81x to 1.13x",
                tone: "bad" as const,
              },
            ].map((row) => (
              <div key={row.label} style={{ borderBottom: "1px solid var(--rule-soft)", paddingBottom: 12 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  {row.label}
                </div>
                <Space align="baseline" size={8}>
                  <span
                    className="numeric"
                    style={{
                      fontSize: 19,
                      fontWeight: 600,
                      color: row.tone === "good" ? "var(--good)" : "var(--alert)",
                    }}
                  >
                    {row.value}
                  </span>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12.5 }}>
                    {row.detail}
                  </Text>
                </div>
              </div>
            ))}
            <Tag color="orange" variant="filled" style={{ marginInlineEnd: 0, whiteSpace: "normal", height: "auto", padding: "6px 8px" }}>
              Growth in FY2025 was funded externally rather than by trading cash.
            </Tag>
          </Space>
        </Card>
      </Col>
    </Row>
  )
}
