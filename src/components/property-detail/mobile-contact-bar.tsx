"use client";

import { PhoneOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { useEffect, useState } from "react";
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

/** Shown once the hero (photo slider, or the title block without photos) has scrolled away, hidden again as the footer comes in. */
export function useBarVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".lgallery") ?? document.querySelector(".pd-head");
    const footer = document.querySelector(".site-footer");
    let frame = 0;

    const update = () => {
      frame = 0;
      const pastHero = hero ? hero.getBoundingClientRect().bottom <= 0 : window.scrollY > 0;
      const beforeFooter = footer ? footer.getBoundingClientRect().top > window.innerHeight : true;
      setVisible(pastHero && beforeFooter);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return visible;
}

/** Phones only: the lister, the price and Call / Chat, pinned to the bottom of the screen between the hero and the footer. */
export function MobileContactBar({ property }: { property: PublicProperty }) {
  const contact = property.contact;
  const whatsapp = whatsappNumber(contact?.whatsapp);
  const visible = useBarVisible();

  if (!contact || (!contact.phone && !whatsapp)) {
    return null;
  }

  const [, amount = "", ...unit] = formatCompactPrice(property.price).split(" ");

  return (
    <div className={`pd-mobile-bar${visible ? " is-visible" : ""}`} aria-hidden={!visible} inert={!visible}>
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
