"use client";

import { PhoneOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Avatar, Button } from "antd";
import Image from "next/image";
import Link from "next/link";
import { BadgeIcon, ChevronRightIcon } from "@/components/icons";
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

/** The lister's card on a listing page: who they are, Call / WhatsApp side by side, and their agency underneath. */
export function ContactCard({ property }: { property: PublicProperty }) {
  const [revealed, setRevealed] = useState(false);
  const contact = property.contact;
  const whatsapp = whatsappNumber(contact?.whatsapp);

  if (!contact) {
    return null;
  }

  return (
    <div className="contact-card pd-contact">
      <div className="pd-contact-person">
        <Avatar size={56} className={contact.photo_url ? undefined : "avatar-accent"} src={contact.photo_url ?? undefined} alt={contact.name}>
          {contact.name.slice(0, 1).toUpperCase()}
        </Avatar>
        <strong>{contact.name}</strong>
      </div>

      <span className="pd-contact-role">
        <BadgeIcon /> {ACCOUNT_TYPE_LABELS[contact.account_type]}
      </span>

      {(contact.phone || whatsapp) && (
        <div className="pd-contact-buttons">
          {contact.phone &&
            (revealed ? (
              <Button icon={<PhoneOutlined />} href={`tel:${contact.phone}`} className="pd-call">
                {contact.phone}
              </Button>
            ) : (
              <Button
                icon={<PhoneOutlined />}
                className="pd-call"
                aria-label="Show phone number"
                onClick={() => {
                  setRevealed(true);
                  track(property.slug, "phone");
                }}
              >
                Call
              </Button>
            ))}
          {whatsapp && (
            <Button
              className="pd-whatsapp"
              icon={<WhatsAppOutlined />}
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I am interested in your listing: ${property.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(property.slug, "whatsapp")}
            >
              WhatsApp
            </Button>
          )}
        </div>
      )}

      {contact.agency && (
        <Link href={`/agencies/${contact.agency.slug}`} className="pd-contact-agency">
          {contact.agency.logo_url ? (
            <Image src={contact.agency.logo_url} alt={contact.agency.name} width={96} height={32} unoptimized />
          ) : (
            <strong>
              {contact.agency.name}
              {contact.agency.is_verified ? " ✓" : ""}
            </strong>
          )}
          <span>
            View all properties <ChevronRightIcon />
          </span>
        </Link>
      )}
    </div>
  );
}
