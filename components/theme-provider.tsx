"use client"

import { App, ConfigProvider } from "antd"
import { fintraceTheme } from "@/lib/theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={fintraceTheme}>
      <App>{children}</App>
    </ConfigProvider>
  )
}
