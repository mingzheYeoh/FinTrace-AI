/** @typedef {"mock" | "backend"} ApiMode */

/**
 * Invalid or absent values fail closed to the browser-only mock.
 *
 * @param {string | undefined} [value]
 * @returns {ApiMode}
 */
export function resolveApiMode(value = process.env.NEXT_PUBLIC_API_MODE) {
  return value === "backend" ? "backend" : "mock"
}

/** @param {ApiMode} mode */
export function shouldStartMocks(mode) {
  return mode === "mock"
}

const UPLOAD_SCOPE = Object.freeze({
  mock: Object.freeze({
    title: "Phase 0 mock scope",
    notice:
      "A mock service worker intercepts this request inside the browser. No file leaves your device.",
    description:
      "This mode uses synthetic fixture data in the frontend only. Authentication, storage, extraction services, and the trusted-agent workflow are not connected.",
  }),
  backend: Object.freeze({
    title: "Phase 1A backend scope",
    notice:
      "Files are sent to the configured Phase 1A backend, validated, and discarded without application persistence.",
    description:
      "Results remain synthetic fixture data. The backend does not extract or analyze document contents, and authentication, persistent storage, and the trusted-agent workflow are not connected.",
  }),
})

/** @param {ApiMode} mode */
export function getUploadScope(mode) {
  return UPLOAD_SCOPE[mode]
}
