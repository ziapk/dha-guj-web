"use client";

import { PhoneOutlined, ShareAltOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { App, Avatar, Button } from "antd";
import Link from "next/link";
import { useState } from "react";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";
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

export function ContactCard({ property }: { property: PublicProperty }) {
  const { message } = App.useApp();
  const [revealed, setRevealed] = useState(false);
  const contact = property.contact;
  const whatsapp = whatsappNumber(contact?.whatsapp);

  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title: property.title, url }).catch(() => undefined);

      return;
    }

    await navigator.clipboard.writeText(url);
    message.success("Link copied to clipboard");
  }

  return (
    <div className="contact-card">
      {contact && (
        <div className="contact-person">
          <Avatar size={48} className="avatar-accent">
            {contact.name.slice(0, 1).toUpperCase()}
          </Avatar>
          <div>
            <strong>{contact.name}</strong>
            <small>{ACCOUNT_TYPE_LABELS[contact.account_type]}</small>
          </div>
        </div>
      )}

      {contact?.agency && (
        <Link href={`/agencies/${contact.agency.slug}`} className="contact-agency">
          <span>
            Listed by <strong>{contact.agency.name}</strong>
            {contact.agency.is_verified ? " ✓" : ""}
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

      {contact?.phone &&
        (revealed ? (
          <Button type="primary" size="large" block icon={<PhoneOutlined />} href={`tel:${contact.phone}`}>
            {contact.phone}
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            block
            icon={<PhoneOutlined />}
            onClick={() => {
              setRevealed(true);
              track(property.slug, "phone");
            }}
          >
            Show phone number
          </Button>
        ))}

      {whatsapp && (
        <Button
          size="large"
          block
          className="btn-whatsapp"
          icon={<WhatsAppOutlined />}
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I am interested in your listing: ${property.title}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(property.slug, "whatsapp")}
        >
          Chat on WhatsApp
        </Button>
      )}

      <Button type="text" block icon={<ShareAltOutlined />} onClick={share}>
        Share this listing
      </Button>
    </div>
  );
}
