import type { Metadata, Viewport } from "next"
import { Inter, IBM_Plex_Mono } from "next/font/google"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import { ThemeProvider } from "@/components/theme-provider"
import { ApiProvider } from "@/components/api-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FinTrace AI — Traceable financial report analysis",
  description:
    "Upload a financial report and receive structured figures, deterministic calculations, trend charts, anomaly alerts and source-level evidence for every number.",
  applicationName: "FinTrace AI",
}

export const viewport: Viewport = {
  themeColor: "#0b1a20",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <ApiProvider>{children}</ApiProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
