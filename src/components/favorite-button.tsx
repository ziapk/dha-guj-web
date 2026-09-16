"use client";

import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useSession } from "@/components/session-provider";

/** Heart toggle; logged-out visitors are sent to log in and brought back afterwards. */
export function FavoriteButton({ propertyId, variant = "overlay" }: { propertyId: number; variant?: "overlay" | "button" }) {
  const { favoriteIds, toggleFavorite } = useSession();
  const saved = favoriteIds.has(propertyId);

  if (variant === "button") {
    return (
      <Button
        size="large"
        block
        icon={saved ? <HeartFilled style={{ color: "#e11d48" }} /> : <HeartOutlined />}
        aria-pressed={saved}
        onClick={() => toggleFavorite(propertyId)}
      >
        {saved ? "Saved to favourites" : "Save to favourites"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      className={`fav-button${saved ? " saved" : ""}`}
      aria-pressed={saved}
      aria-label={saved ? "Remove from favourites" : "Save to favourites"}
      onClick={() => toggleFavorite(propertyId)}
    >
      {saved ? <HeartFilled /> : <HeartOutlined />}
    </button>
  );
}
