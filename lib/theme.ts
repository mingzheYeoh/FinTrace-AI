import type { ThemeConfig } from "antd"

/**
 * FinTrace AI — instrument-panel aesthetic.
 * Deep slate ink, one trustworthy teal accent, amber/rose reserved for
 * exception states so a coloured cell always means something.
 */
export const fintraceTheme: ThemeConfig = {
  cssVar: { prefix: "ft" },
  token: {
    colorPrimary: "#0f6f78",
    colorInfo: "#0f6f78",
    colorSuccess: "#1f8f5f",
    colorWarning: "#b8770c",
    colorError: "#b3323c",
    colorTextBase: "#111c22",
    colorBgBase: "#ffffff",
    colorBgLayout: "#f3f5f6",
    colorBorder: "#dfe4e6",
    colorBorderSecondary: "#ebeef0",
    borderRadius: 4,
    fontFamily: "var(--font-body)",
    fontSize: 14,
    lineHeight: 1.55,
    controlHeight: 34,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: "#0b1a20",
      headerHeight: 56,
      headerPadding: "0 24px",
      bodyBg: "#f3f5f6",
    },
    Card: {
      headerFontSize: 14,
      headerHeight: 46,
      paddingLG: 20,
    },
    Statistic: {
      contentFontSize: 26,
      titleFontSize: 13,
    },
    Table: {
      headerBg: "#f7f9f9",
      headerColor: "#4a5b63",
      rowHoverBg: "#f4f8f8",
      cellPaddingBlock: 12,
      borderColor: "#ebeef0",
    },
    Steps: {
      iconSize: 26,
    },
    Descriptions: {
      labelBg: "#f7f9f9",
    },
    Tag: {
      defaultBg: "#f2f5f6",
    },
    Drawer: {
      paddingLG: 20,
    },
    Alert: {
      // The teal colorInfo is dark enough to read as a filled banner, so the
      // info variant gets an explicit light wash and legible ink.
      colorInfoBg: "#eef5f6",
      colorInfoBorder: "#cfe1e3",
      colorInfo: "#0f6f78",
      colorText: "#111c22",
      colorTextHeading: "#111c22",
    },
  },
}

/** Shared categorical palette for Ant Design Charts. */
export const chartPalette = ["#0f6f78", "#b3323c", "#b8770c", "#4a5b63", "#1f8f5f"]
