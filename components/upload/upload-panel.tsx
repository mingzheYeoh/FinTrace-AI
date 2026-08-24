"use client"

import { useMemo, useState } from "react"
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  List,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd"
import type { UploadFile } from "antd"
import {
  CloudUploadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  InboxOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons"
import { caseSummary } from "@/lib/mock-data"

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

const ACCEPTED = [".pdf", ".xlsx", ".csv"]
const MAX_BYTES = 20 * 1024 * 1024

export interface StagedFile {
  uid: string
  name: string
  sizeLabel: string
  kind: "pdf" | "xlsx" | "csv"
}

function kindOf(name: string): StagedFile["kind"] | null {
  const lower = name.toLowerCase()
  if (lower.endsWith(".pdf")) return "pdf"
  if (lower.endsWith(".xlsx")) return "xlsx"
  if (lower.endsWith(".csv")) return "csv"
  return null
}

function sizeLabel(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const kindIcon = {
  pdf: <FilePdfOutlined style={{ color: "var(--alert)", fontSize: 18 }} />,
  xlsx: <FileExcelOutlined style={{ color: "var(--good)", fontSize: 18 }} />,
  csv: <FileTextOutlined style={{ color: "var(--ink-soft)", fontSize: 18 }} />,
}

export function UploadPanel({ onStart }: { onStart: (files: StagedFile[]) => void }) {
  const { message } = App.useApp()
  const [staged, setStaged] = useState<StagedFile[]>([])
  const [rejection, setRejection] = useState<string | null>(null)

  const canStart = staged.length > 0

  const beforeUpload = (file: UploadFile & { size?: number }) => {
    const kind = kindOf(file.name)

    if (!kind) {
      setRejection(
        `“${file.name}” was not accepted. FinTrace AI reads searchable PDF, XLSX and structured CSV files. The file was not queued and your current case is unchanged.`,
      )
      return Upload.LIST_IGNORE
    }

    if ((file.size ?? 0) > MAX_BYTES) {
      setRejection(`“${file.name}” exceeds the 20 MB per-file limit for this prototype and was not queued.`)
      return Upload.LIST_IGNORE
    }

    if (staged.some((s) => s.name === file.name)) {
      message.info(`${file.name} is already queued — it was not added twice.`)
      return Upload.LIST_IGNORE
    }

    setRejection(null)
    setStaged((prev) => [
      ...prev,
      { uid: file.uid, name: file.name, sizeLabel: sizeLabel(file.size ?? 0), kind },
    ])
    // Phase 0: nothing is transmitted anywhere.
    return Upload.LIST_IGNORE
  }

  const loadSample = () => {
    setRejection(null)
    setStaged(
      caseSummary.documents.map((d) => ({
        uid: d.id,
        name: d.name,
        sizeLabel: d.sizeLabel,
        kind: d.kind,
      })),
    )
    message.success("Loaded the synthetic demonstration file set.")
  }

  const remove = (uid: string) => setStaged((prev) => prev.filter((s) => s.uid !== uid))

  const summary = useMemo(() => {
    const counts = staged.reduce<Record<string, number>>((acc, f) => {
      acc[f.kind] = (acc[f.kind] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .map(([k, n]) => `${n} ${k.toUpperCase()}`)
      .join(" · ")
  }, [staged])

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={14}>
        <Card
          title={
            <Space size={8}>
              <CloudUploadOutlined style={{ color: "var(--accent)" }} />
              <span>New analysis</span>
            </Space>
          }
          extra={
            <Button size="small" icon={<ThunderboltOutlined />} onClick={loadSample}>
              Use demo files
            </Button>
          }
          className="upload-shell"
        >
          <Dragger
            multiple
            accept={ACCEPTED.join(",")}
            beforeUpload={beforeUpload}
            showUploadList={false}
            style={{ padding: "12px 0" }}
          >
            <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
              <InboxOutlined style={{ color: "var(--accent)" }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 14.5, fontWeight: 500 }}>
              Drop financial reports here, or click to browse
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 12.5 }}>
              Searchable PDF, XLSX or structured CSV · up to 20 MB per file
            </p>
          </Dragger>

          {rejection && (
            <Alert
              type="error"
              showIcon
              closable
              onClose={() => setRejection(null)}
              style={{ marginTop: 16 }}
              message="Unsupported file"
              description={rejection}
            />
          )}

          <Divider style={{ margin: "20px 0 12px" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {staged.length > 0 ? `${staged.length} file${staged.length > 1 ? "s" : ""} queued · ${summary}` : "Queue"}
            </Text>
          </Divider>

          {staged.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<Text type="secondary">No files queued yet</Text>}
            />
          ) : (
            <List
              size="small"
              dataSource={staged}
              rowKey="uid"
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(file.uid)}
                      aria-label={`Remove ${file.name}`}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={kindIcon[file.kind]}
                    title={
                      <span className="numeric" style={{ fontSize: 13 }}>
                        {file.name}
                      </span>
                    }
                    description={
                      <Space size={6}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {file.sizeLabel}
                        </Text>
                        <Tag color="green" variant="outlined" style={{ fontSize: 11 }}>
                          Validated
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}

          <Flex justify="space-between" align="center" gap={12} wrap style={{ marginTop: 20 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Files stay in the browser. Nothing is uploaded in this prototype.
            </Text>
            <Button
              type="primary"
              size="large"
              disabled={!canStart}
              onClick={() => onStart(staged)}
              icon={<ThunderboltOutlined />}
            >
              Run analysis
            </Button>
          </Flex>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Flex vertical gap={20}>
          <Card title="What FinTrace AI extracts">
            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 14 }}>
              Every figure is pulled from a specific page, sheet or cell and kept alongside its raw source text, so any
              number on the dashboard can be traced back to the document it came from.
            </Paragraph>
            <Flex wrap gap={6}>
              {[
                "Revenue",
                "Gross profit",
                "Operating profit",
                "Net profit",
                "Operating cash flow",
                "Current assets",
                "Current liabilities",
                "Total assets",
                "Equity",
                "Borrowings",
                "Receivables",
                "Payables",
                "Inventory",
                "Cash",
              ].map((field) => (
                <Tag key={field} variant="filled" style={{ marginInlineEnd: 0 }}>
                  {field}
                </Tag>
              ))}
            </Flex>
          </Card>

          <Card title="How this prototype behaves">
            <List
              size="small"
              split={false}
              dataSource={[
                "Ratios and period changes are computed in code, never guessed by a model.",
                "Missing, unreadable, ambiguous and conflicting values are labelled separately — no figure is invented to fill a gap.",
                "Conflicting values from two documents are both kept and flagged for review.",
                "Anomalies are investigation prompts, not findings of fraud or insolvency.",
              ]}
              renderItem={(item) => (
                <List.Item style={{ paddingInline: 0, paddingBlock: 6, border: "none" }}>
                  <Space align="start" size={8}>
                    <span
                      aria-hidden
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        marginTop: 8,
                        flex: "0 0 auto",
                      }}
                    />
                    <Text style={{ fontSize: 13 }}>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Alert
            type="info"
            showIcon
            message="Phase 0 scope"
            description="This build is the frontend prototype only. Authentication, storage, extraction services and the trusted-agent workflow are not connected yet."
          />
        </Flex>
      </Col>
    </Row>
  )
}
