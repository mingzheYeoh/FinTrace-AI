import { resolveApiMode } from "./src/lib/api/mode.mjs"

const apiMode = resolveApiMode()
const backendUrl = (process.env.FINTRACE_BACKEND_URL ?? "http://127.0.0.1:8000").replace(
  /\/+$/,
  "",
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  transpilePackages: ["antd", "@ant-design/icons", "@ant-design/charts", "@ant-design/nextjs-registry"],
  ...(apiMode === "backend"
    ? {
        async rewrites() {
          return [
            {
              source: "/api/v1/:path*",
              destination: `${backendUrl}/api/v1/:path*`,
            },
          ]
        },
      }
    : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
