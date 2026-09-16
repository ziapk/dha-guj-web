import { theme, type ThemeConfig } from "antd";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeSettings = { mode: ThemeMode };

export const DEFAULT_SETTINGS: ThemeSettings = { mode: "system" };

export const FONT_BODY = "'Open Sans Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Brand palette; the same values are CSS variables in app/globals.css. */
const PALETTE = {
  light: { primary: "#3a307f", link: "#3a307f", layout: "#ffffff", container: "#ffffff", elevated: "#ffffff", border: "#cccccc", borderSoft: "#e3e3e3", text: "#1a1a1a", muted: "#707070", selected: "#e7e5f4" },
  dark: { primary: "#6459b2", link: "#a9a2e0", layout: "#111019", container: "#1a1824", elevated: "#22202e", border: "#3a3650", borderSoft: "#2e2b3d", text: "#ececf1", muted: "#a3a0b5", selected: "#2a2548" },
};

export function buildTheme(mode: "light" | "dark"): ThemeConfig {
  const colors = PALETTE[mode];

  return {
    algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: colors.primary,
      colorInfo: colors.primary,
      colorLink: colors.link,
      colorSuccess: "#00a663",
      colorWarning: "#dda800",
      colorError: "#cf3151",
      colorBgLayout: colors.layout,
      colorBgContainer: colors.container,
      colorBgElevated: colors.elevated,
      colorBorder: colors.border,
      colorBorderSecondary: colors.borderSoft,
      colorText: colors.text,
      colorTextSecondary: colors.muted,
      fontFamily: FONT_BODY,
      fontSize: 14,
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
      controlHeight: 40,
      controlHeightLG: 48,
      motionDurationMid: "0.2s",
    },
    components: {
      Button: { primaryShadow: "none", defaultShadow: "none", dangerShadow: "none", fontWeight: 600 },
      Select: { optionSelectedBg: colors.selected },
      Segmented: { itemSelectedColor: colors.primary },
    },
  };
}
