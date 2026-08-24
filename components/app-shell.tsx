"use client"

import { Flex, Layout, Space, Tag, Tooltip, Typography } from "antd"
import { NodeIndexOutlined } from "@ant-design/icons"

const { Header, Content, Footer } = Layout
const { Text } = Typography

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header>
        <Flex align="center" justify="space-between" gap={12} style={{ height: "100%" }}>
          <Flex align="center" gap={10} style={{ minWidth: 0 }}>
            <NodeIndexOutlined style={{ color: "#4fd1c5", fontSize: 18, flex: "0 0 auto" }} aria-hidden />
            <Text
              style={{ color: "#fff", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}
            >
              FinTrace AI
            </Text>
            {/* The tagline is supporting copy — drop it before the brand ever wraps. */}
            <Text className="header-tagline" style={{ color: "#7d949c", fontSize: 12.5, whiteSpace: "nowrap" }}>
              Traceable financial report analysis
            </Text>
          </Flex>
          <Space size={8} style={{ flex: "0 0 auto" }}>
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
        </Flex>
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
