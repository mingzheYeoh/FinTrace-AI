import type { AnalysisStatusResponse } from "../../lib/api/client"

export type ResultPresentationState = "idle" | "loading" | "ready" | "not_ready" | "error"

export interface ProcessingAlert {
  type: "info" | "warning" | "error"
  title: string
  description: string
}

export interface ProcessingPresentation {
  phase: "processing" | "completed" | "completed_with_review_flags" | "failed"
  tone: "processing" | "success" | "warning" | "error"
  badgeLabel: "In progress" | "Completed" | "Completed with review flags" | "Failed"
  badgeColor: "blue" | "green" | "gold" | "red"
  kicker: string
  hero: string
  subtitle: string
  showDashboardAction: boolean
  dashboardEnabled: boolean
  dashboardLoading: boolean
  resultAlert: ProcessingAlert | null
  sideAlert: ProcessingAlert | null
}

export function presentProcessingStatus(
  status: AnalysisStatusResponse | undefined,
  resultState: ResultPresentationState,
): ProcessingPresentation {
  const isCompleted = status?.status === "completed"
  const isFailed = status?.status === "failed"
  const withReviewFlags = status?.completion_outcome === "completed_with_review_flags"

  if (isFailed) {
    return {
      phase: "failed",
      tone: "error",
      badgeLabel: "Failed",
      badgeColor: "red",
      kicker: "Pipeline halted",
      hero: "Analysis failed",
      subtitle: status.error?.message ?? status.message ?? "The analysis could not be completed.",
      showDashboardAction: false,
      dashboardEnabled: false,
      dashboardLoading: false,
      resultAlert: null,
      sideAlert: {
        type: "error",
        title: "Analysis could not be completed",
        description: status.error?.message ?? status.message ?? "Start a new analysis and try again.",
      },
    }
  }

  if (isCompleted) {
    const { extracted_fields: extracted, targeted_fields: targeted, manual_review_count: reviews } =
      status.extraction_summary
    const coverage = `${extracted} of ${targeted} fields extracted`

    const reviewText = `${reviews} item${reviews === 1 ? "" : "s"} require review`
    const supportingText = withReviewFlags ? `${coverage} · ${reviewText}` : coverage
    const dashboardReady = resultState === "ready"
    const resultPresentation = {
      ready: {
        hero: "Analysis ready",
        subtitle: supportingText,
        resultAlert: null,
      },
      loading: {
        hero: "Finalizing analysis result",
        subtitle: `${supportingText} · Retrieving the dashboard result`,
        resultAlert: null,
      },
      idle: {
        hero: "Finalizing analysis result",
        subtitle: `${supportingText} · Retrieving the dashboard result`,
        resultAlert: null,
      },
      not_ready: {
        hero: "Analysis result still preparing",
        subtitle: `${supportingText} · The dashboard result is not ready yet`,
        resultAlert: {
          type: "info" as const,
          title: "Result not ready yet",
          description:
            "The pipeline completed, but the dashboard result is still being assembled. Processing state has been preserved.",
        },
      },
      error: {
        hero: "Analysis result unavailable",
        subtitle: `${supportingText} · The dashboard result could not be retrieved`,
        resultAlert: {
          type: "error" as const,
          title: "Analysis result unavailable",
          description:
            "The pipeline completed, but the result could not be retrieved. Retry before opening the dashboard.",
        },
      },
    }[resultState]

    return {
      phase: withReviewFlags ? "completed_with_review_flags" : "completed",
      tone: withReviewFlags ? "warning" : "success",
      badgeLabel: withReviewFlags ? "Completed with review flags" : "Completed",
      badgeColor: withReviewFlags ? "gold" : "green",
      kicker: "Pipeline complete",
      hero: resultPresentation.hero,
      subtitle: resultPresentation.subtitle,
      showDashboardAction: dashboardReady,
      dashboardEnabled: dashboardReady,
      dashboardLoading: resultState === "loading",
      resultAlert: resultPresentation.resultAlert,
      sideAlert:
        withReviewFlags && reviews > 0
          ? {
              type: "warning",
              title: `${reviews} item${reviews === 1 ? "" : "s"} need manual review`,
              description:
                "Review each flagged item and its source evidence before relying on this analysis.",
            }
          : null,
    }
  }

  const stages = status?.stages ?? []
  const total = stages.length || 6
  const activeIndex = status
    ? stages.findIndex((stage) => stage.key === status.active_stage)
    : -1
  const currentStage = activeIndex >= 0 ? stages[activeIndex] : undefined

  return {
    phase: "processing",
    tone: "processing",
    badgeLabel: "In progress",
    badgeColor: "blue",
    kicker: activeIndex >= 0 ? `Stage ${activeIndex + 1} of ${total}` : "Preparing pipeline",
    hero: currentStage?.title ?? "Starting analysis",
    subtitle: currentStage?.description ?? status?.message ?? "Preparing the pipeline…",
    showDashboardAction: false,
    dashboardEnabled: false,
    dashboardLoading: false,
    resultAlert: null,
    sideAlert: null,
  }
}
