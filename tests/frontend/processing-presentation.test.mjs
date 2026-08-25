import assert from "node:assert/strict"
import test from "node:test"

import { presentProcessingStatus } from "../../src/features/analysis/processing-presentation.ts"

const activeStage = {
  key: "validate",
  title: "Validate input",
  description: "File type, size, and parseability checks",
  state: "active",
  progress_percent: 50,
  logs: [],
}

function makeStatus(overrides = {}) {
  return {
    analysis_id: "anl_test_001",
    status: "validating",
    completion_outcome: null,
    progress_percent: 8,
    active_stage: "validate",
    message: "File type, size, and parseability checks",
    stages: [activeStage],
    extraction_summary: {
      targeted_fields: 19,
      extracted_fields: 0,
      manual_review_count: 0,
    },
    error: null,
    ...overrides,
  }
}

test("processing copy follows the active API stage and keeps the dashboard unavailable", () => {
  assert.deepEqual(presentProcessingStatus(makeStatus(), "idle"), {
    phase: "processing",
    tone: "processing",
    badgeLabel: "In progress",
    badgeColor: "blue",
    kicker: "Stage 1 of 1",
    hero: "Validate input",
    subtitle: "File type, size, and parseability checks",
    showDashboardAction: true,
    dashboardEnabled: false,
    dashboardLoading: false,
    resultAlert: null,
    sideAlert: null,
  })
})

test("clean completion reports API coverage and enables a ready result", () => {
  const status = makeStatus({
    status: "completed",
    completion_outcome: "completed",
    progress_percent: 100,
    active_stage: null,
    extraction_summary: {
      targeted_fields: 19,
      extracted_fields: 19,
      manual_review_count: 0,
    },
  })

  assert.deepEqual(presentProcessingStatus(status, "ready"), {
    phase: "completed",
    tone: "success",
    badgeLabel: "Completed",
    badgeColor: "green",
    kicker: "Pipeline complete",
    hero: "Analysis ready",
    subtitle: "19 of 19 fields extracted",
    showDashboardAction: true,
    dashboardEnabled: true,
    dashboardLoading: false,
    resultAlert: null,
    sideAlert: null,
  })
})

test("review-flag completion reports API coverage and review count with warning tone", () => {
  const status = makeStatus({
    status: "completed",
    completion_outcome: "completed_with_review_flags",
    progress_percent: 100,
    active_stage: null,
    extraction_summary: {
      targeted_fields: 19,
      extracted_fields: 17,
      manual_review_count: 3,
    },
  })

  assert.deepEqual(presentProcessingStatus(status, "ready"), {
    phase: "completed_with_review_flags",
    tone: "warning",
    badgeLabel: "Completed with review flags",
    badgeColor: "gold",
    kicker: "Pipeline complete",
    hero: "Analysis ready",
    subtitle: "17 of 19 fields extracted · 3 items require review",
    showDashboardAction: true,
    dashboardEnabled: true,
    dashboardLoading: false,
    resultAlert: null,
    sideAlert: {
      type: "warning",
      title: "3 items need manual review",
      description: "Review each flagged item and its source evidence before relying on this analysis.",
    },
  })
})

test("terminal completion does not enable the dashboard until result retrieval succeeds", () => {
  const status = makeStatus({
    status: "completed",
    completion_outcome: "completed_with_review_flags",
    active_stage: null,
  })

  const loading = presentProcessingStatus(status, "loading")
  assert.equal(loading.hero, "Finalizing analysis result")
  assert.match(loading.subtitle, /Retrieving the dashboard result/)
  assert.equal(loading.dashboardEnabled, false)
  assert.equal(loading.dashboardLoading, true)
  assert.equal(loading.resultAlert, null)

  const notReady = presentProcessingStatus(status, "not_ready")
  assert.equal(notReady.hero, "Analysis result still preparing")
  assert.equal(notReady.dashboardEnabled, false)
  assert.deepEqual(notReady.resultAlert, {
    type: "info",
    title: "Result not ready yet",
    description:
      "The pipeline completed, but the dashboard result is still being assembled. Processing state has been preserved.",
  })

  const error = presentProcessingStatus(status, "error")
  assert.equal(error.hero, "Analysis result unavailable")
  assert.equal(error.dashboardEnabled, false)
  assert.equal(error.dashboardLoading, false)
  assert.deepEqual(error.resultAlert, {
    type: "error",
    title: "Analysis result unavailable",
    description:
      "The pipeline completed, but the result could not be retrieved. Retry before opening the dashboard.",
  })
})

test("failed processing presents failure and removes the dashboard action", () => {
  const status = makeStatus({
    status: "failed",
    completion_outcome: null,
    progress_percent: 42,
    active_stage: null,
    error: {
      code: "PROCESSING_FAILED",
      message: "The analysis could not be completed. Start a new analysis and try again.",
      retryable: true,
    },
  })

  assert.deepEqual(presentProcessingStatus(status, "error"), {
    phase: "failed",
    tone: "error",
    badgeLabel: "Failed",
    badgeColor: "red",
    kicker: "Pipeline halted",
    hero: "Analysis failed",
    subtitle: "The analysis could not be completed. Start a new analysis and try again.",
    showDashboardAction: false,
    dashboardEnabled: false,
    dashboardLoading: false,
    resultAlert: null,
    sideAlert: {
      type: "error",
      title: "Analysis could not be completed",
      description: "The analysis could not be completed. Start a new analysis and try again.",
    },
  })
})
