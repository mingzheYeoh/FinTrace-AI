"use client"

import { Layout, Space, Tag, Tooltip, Typography } from "antd"
import { NodeIndexOutlined } from "@ant-design/icons"

const { Header, Content, Footer } = Layout
const { Text } = Typography

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header>
        <Space align="center" style={{ height: "100%", width: "100%", justifyContent: "space-between" }}>
          <Space align="center" size={10}>
            <NodeIndexOutlined style={{ color: "#4fd1c5", fontSize: 18 }} aria-hidden />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>FinTrace AI</Text>
            <Text style={{ color: "#7d949c", fontSize: 12.5 }}>Traceable financial report analysis</Text>
          </Space>
          <Space size={8}>
            <Tooltip title="Phase 0 prototype: no authentication, database or backend services are connected.">
              <Tag color="blue" variant="filled" style={{ marginInlineEnd: 0 }}>
                Phase 0 prototype
              </Tag>
            </Tooltip>
            <Tooltip title="All figures shown are synthetic demonstration data, not a real company.">
              <Tag color="gold" variant="filled" style={{ marginInlineEnd: 0 }}>
                Synthetic data
              </Tag>
            </Tooltip>
          </Space>
        </Space>
      </Header>

      <Content>
        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 40px" }}>{children}</main>
      </Content>

      <Footer style={{ background: "transparent", borderTop: "1px solid var(--rule)", textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 12.5 }}>
          FinTrace AI supports financial review. It does not provide investment, lending, audit, legal or tax advice, and
          does not replace professional judgement.
        </Text>
      </Footer>
    </Layout>
  )
}
