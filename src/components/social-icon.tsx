"use client";

import { FacebookFilled, GlobalOutlined, InstagramOutlined, LinkedinFilled, TikTokOutlined, XOutlined, YoutubeFilled } from "@ant-design/icons";
import type { ReactNode } from "react";

const SOCIAL_ICONS: Record<string, ReactNode> = {
  facebook: <FacebookFilled />,
  instagram: <InstagramOutlined />,
  linkedin: <LinkedinFilled />,
  x: <XOutlined />,
  youtube: <YoutubeFilled />,
  tiktok: <TikTokOutlined />,
  website: <GlobalOutlined />,
};

/** The Ant Design icon for a social network key. A client component because the icons read React context, which Server Components cannot. */
export function SocialIcon({ network }: { network: string }) {
  return SOCIAL_ICONS[network] ?? null;
}
