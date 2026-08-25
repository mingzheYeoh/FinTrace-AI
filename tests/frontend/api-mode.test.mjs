import assert from "node:assert/strict"
import test from "node:test"

const modeModuleUrl = new URL("../../src/lib/api/mode.mjs", import.meta.url)
const { getUploadScope, resolveApiMode, shouldStartMocks } = await import(modeModuleUrl)

test("API mode defaults safely to mock and opts into backend explicitly", () => {
  assert.equal(resolveApiMode(), "mock")
  assert.equal(resolveApiMode("mock"), "mock")
  assert.equal(resolveApiMode("unexpected"), "mock")
  assert.equal(resolveApiMode("backend"), "backend")
  assert.equal(shouldStartMocks("mock"), true)
  assert.equal(shouldStartMocks("backend"), false)
})

test("upload scope copy is truthful in each mode", () => {
  assert.deepEqual(getUploadScope("mock"), {
    title: "Phase 0 mock scope",
    notice:
      "A mock service worker intercepts this request inside the browser. No file leaves your device.",
    description:
      "This mode uses synthetic fixture data in the frontend only. Authentication, storage, extraction services, and the trusted-agent workflow are not connected.",
  })
  assert.deepEqual(getUploadScope("backend"), {
    title: "Phase 1A backend scope",
    notice:
      "Files are sent to the configured Phase 1A backend, validated, and discarded without application persistence.",
    description:
      "Results remain synthetic fixture data. The backend does not extract or analyze document contents, and authentication, persistent storage, and the trusted-agent workflow are not connected.",
  })
})

test("the same-origin rewrite exists only in backend mode", async () => {
  const originalMode = process.env.NEXT_PUBLIC_API_MODE
  const originalBackendUrl = process.env.FINTRACE_BACKEND_URL

  try {
    process.env.NEXT_PUBLIC_API_MODE = "mock"
    process.env.FINTRACE_BACKEND_URL = "http://127.0.0.1:9123/"
    const mockConfig = (await import("../../next.config.mjs?mode=mock")).default
    assert.equal(mockConfig.rewrites, undefined)

    process.env.NEXT_PUBLIC_API_MODE = "backend"
    const backendConfig = (await import("../../next.config.mjs?mode=backend")).default
    assert.deepEqual(await backendConfig.rewrites(), [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:9123/api/v1/:path*",
      },
    ])
    assert.deepEqual(backendConfig.transpilePackages, mockConfig.transpilePackages)
    assert.deepEqual(await backendConfig.headers(), await mockConfig.headers())
  } finally {
    if (originalMode === undefined) delete process.env.NEXT_PUBLIC_API_MODE
    else process.env.NEXT_PUBLIC_API_MODE = originalMode
    if (originalBackendUrl === undefined) delete process.env.FINTRACE_BACKEND_URL
    else process.env.FINTRACE_BACKEND_URL = originalBackendUrl
  }
})
