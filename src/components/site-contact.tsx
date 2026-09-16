"use client";

import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  FacebookFilled,
  InstagramOutlined,
  LinkedinFilled,
  MailOutlined,
  PhoneOutlined,
  TikTokOutlined,
  WhatsAppOutlined,
  XOutlined,
  YoutubeFilled,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { whatsappNumber } from "@/lib/property";
import type { SiteSettings, SocialNetwork } from "@/types/api";

type Contact = SiteSettings["contact"];

const SOCIAL: { key: SocialNetwork; label: string; icon: ReactNode }[] = [
  { key: "facebook", label: "Facebook", icon: <FacebookFilled /> },
  { key: "instagram", label: "Instagram", icon: <InstagramOutlined /> },
  { key: "youtube", label: "YouTube", icon: <YoutubeFilled /> },
  { key: "x", label: "X (Twitter)", icon: <XOutlined /> },
  { key: "linkedin", label: "LinkedIn", icon: <LinkedinFilled /> },
  { key: "tiktok", label: "TikTok", icon: <TikTokOutlined /> },
];

/** Phone, WhatsApp, email, address and office hours; only the values that are set. */
export function ContactList({ contact, className = "contact-list" }: { contact: Contact; className?: string }) {
  const whatsapp = whatsappNumber(contact.whatsapp);

  if (!Object.values(contact).some(Boolean)) {
    return null;
  }

  return (
    <ul className={className}>
      {contact.phone && (
        <li>
          <PhoneOutlined aria-hidden />
          <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${contact.phone}`}>
            {contact.phone}
          </a>
        </li>
      )}
      {contact.whatsapp && (
        <li>
          <WhatsAppOutlined aria-hidden />
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${contact.whatsapp} (opens in a new tab)`}>
              {contact.whatsapp}
            </a>
          ) : (
            <span>{contact.whatsapp}</span>
          )}
        </li>
      )}
      {contact.email && (
        <li>
          <MailOutlined aria-hidden />
          <a href={`mailto:${contact.email}`} aria-label={`Email ${contact.email}`}>
            {contact.email}
          </a>
        </li>
      )}
      {contact.address && (
        <li>
          <EnvironmentOutlined aria-hidden />
          <address>{contact.address}</address>
        </li>
      )}
      {contact.office_hours && (
        <li>
          <ClockCircleOutlined aria-hidden />
          <span>{contact.office_hours}</span>
        </li>
      )}
    </ul>
  );
}

/** Icon links for the social networks that have a URL. */
export function SocialLinks({ social, siteName }: { social: SiteSettings["social"]; siteName: string }) {
  const links = SOCIAL.filter((item) => social[item.key]);

  if (links.length === 0) {
    return null;
  }

  return (
    <ul className="social-links" aria-label={`${siteName} on social media`}>
      {links.map((item) => (
        <li key={item.key}>
          <a href={social[item.key] ?? undefined} target="_blank" rel="noopener noreferrer me" aria-label={`${siteName} on ${item.label} (opens in a new tab)`} title={item.label}>
            {item.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
