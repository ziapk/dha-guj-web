"use client";

import { CheckOutlined, HeartFilled, HeartOutlined } from "@ant-design/icons";
import { App } from "antd";
import Link from "next/link";
import { CompareIcon, ShareIcon } from "@/components/icons";
import { useSession } from "@/components/session-provider";
import { MAX_COMPARE, compareStore } from "@/lib/id-store";

/** Save / Compare / Share links beside the listing price. */
export function ListingActions({ propertyId, title }: { propertyId: number; title: string }) {
  const { message } = App.useApp();
  const { favoriteIds, toggleFavorite } = useSession();
  const compareIds = compareStore.useIds();
  const saved = favoriteIds.has(propertyId);
  const compared = compareIds.includes(propertyId);

  function toggleCompare() {
    const current = compareStore.read();

    if (current.includes(propertyId)) {
      compareStore.remove(propertyId);

      return;
    }

    if (current.length >= MAX_COMPARE) {
      message.warning(
        <span>
          You can compare up to {MAX_COMPARE} properties. Remove one first, or <Link href="/compare">compare them now</Link>.
        </span>,
      );

      return;
    }

    compareStore.write([...current, propertyId]);
  }

  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);

      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      message.success("Link copied to clipboard");
    } catch {
      message.error("Could not copy the link");
    }
  }

  return (
    <div className="pd-actions">
      <button type="button" className={saved ? "is-active" : undefined} aria-pressed={saved} onClick={() => toggleFavorite(propertyId)}>
        {saved ? <HeartFilled className="pd-heart" /> : <HeartOutlined />}
        {saved ? "Saved" : "Save"}
      </button>
      <button type="button" className={compared ? "is-active" : undefined} aria-pressed={compared} onClick={toggleCompare}>
        {compared ? <CheckOutlined /> : <CompareIcon />}
        Compare
      </button>
      <button type="button" onClick={share}>
        <ShareIcon />
        Share
      </button>
    </div>
  );
}
