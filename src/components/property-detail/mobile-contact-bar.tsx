"use client";

import { PhoneOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { sizedImage } from "@/lib/image";
import { formatCompactPrice } from "@/lib/labels";
import { whatsappNumber } from "@/lib/property";
import type { PublicProperty } from "@/types/api";

function track(slug: string, event: "phone" | "whatsapp") {
  void fetch(`/api/track/${encodeURIComponent(slug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => undefined);
}

/** Phones only: the lister, the price and Call / Chat, pinned to the bottom of the screen while the listing scrolls. */
export function MobileContactBar({ property }: { property: PublicProperty }) {
  const contact = property.contact;
  const whatsapp = whatsappNumber(contact?.whatsapp);

  if (!contact || (!contact.phone && !whatsapp)) {
    return null;
  }

  const [, amount = "", ...unit] = formatCompactPrice(property.price).split(" ");

  return (
    <div className="pd-mobile-bar">
      <Avatar size={40} className={contact.photo_url ? undefined : "avatar-accent"} src={sizedImage(contact.photo_url, "thumbnail") ?? undefined} alt={contact.name}>
        {contact.name.slice(0, 1).toUpperCase()}
      </Avatar>
      <div className="pd-mobile-bar-price">
        <small>Price</small>
        <strong>
          PKR {amount} {unit.length > 0 && <span>{unit.join(" ")}</span>}
        </strong>
      </div>
      {contact.phone && (
        <a className="pd-mobile-bar-call" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} onClick={() => track(property.slug, "phone")}>
          <PhoneOutlined /> Call
        </a>
      )}
      {whatsapp && (
        <a
          className="pd-mobile-bar-chat"
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I am interested in your listing: ${property.title}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(property.slug, "whatsapp")}
        >
          <WhatsAppOutlined /> Chat
        </a>
      )}
    </div>
  );
}
