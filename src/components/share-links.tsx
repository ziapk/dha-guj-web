"use client";

import { FacebookFilled, LinkOutlined, LinkedinFilled, WhatsAppOutlined, XOutlined } from "@ant-design/icons";
import { App } from "antd";

/** Share an article on social networks or copy its link. `url` must be absolute. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const { message } = App.useApp();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const networks = [
    { name: "Facebook", icon: <FacebookFilled />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: "X", icon: <XOutlined />, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { name: "WhatsApp", icon: <WhatsAppOutlined />, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { name: "LinkedIn", icon: <LinkedinFilled />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      message.success("Link copied");
    } catch {
      message.error("Could not copy the link");
    }
  }

  return (
    <div className="share-links">
      <span className="share-links-label">Share</span>
      <ul>
        {networks.map((network) => (
          <li key={network.name}>
            <a href={network.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${network.name} (opens in a new tab)`}>
              {network.icon}
            </a>
          </li>
        ))}
        <li>
          <button type="button" onClick={copy} aria-label="Copy link">
            <LinkOutlined />
          </button>
        </li>
      </ul>
    </div>
  );
}
