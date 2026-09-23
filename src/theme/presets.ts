import { theme, type ThemeConfig } from "antd";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeSettings = { mode: ThemeMode };

export const DEFAULT_SETTINGS: ThemeSettings = { mode: "system" };

export const FONT_BODY = "'Plus Jakarta Sans Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Brand palette; the same values are CSS variables in app/globals.css. */
const PALETTE = {
  light: { primary: "#1877f2", link: "#1877f2", layout: "#ffffff", container: "#ffffff", elevated: "#ffffff", border: "#cbd5e1", borderSoft: "#e6ebf2", text: "#12233f", muted: "#64748b", selected: "#e8f1fe" },
  dark: { primary: "#1877f2", link: "#64a6ff", layout: "#0b1220", container: "#121b2c", elevated: "#18233a", border: "#33415c", borderSoft: "#23304a", text: "#e7ecf5", muted: "#94a3b8", selected: "#14294a" },
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
