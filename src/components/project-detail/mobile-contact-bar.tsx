"use client";

import { PhoneOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { BadgeIcon } from "@/components/icons";
import { useBarVisible } from "@/components/property-detail/mobile-contact-bar";
import { sizedImage } from "@/lib/image";
import { whatsappNumber } from "@/lib/property";
import type { PublicProject } from "@/types/api";

/** Phones only: the project's sales contact with Call / WhatsApp, pinned to the bottom of the screen between the hero and the footer. */
export function ProjectMobileBar({ project }: { project: PublicProject }) {
  const contact = project.contact;
  const whatsapp = whatsappNumber(contact?.whatsapp);
  const visible = useBarVisible();

  if (!contact?.phone && !whatsapp) {
    return null;
  }

  const name = contact?.name ?? project.developer_name;
  const role = contact?.name && contact.name !== project.developer_name ? "Sales Contact" : "Project Developer";

  return (
    <div className={`pd-mobile-bar pj-mobile-bar${visible ? " is-visible" : ""}`} aria-hidden={!visible} inert={!visible}>
      <Avatar size={40} className={contact?.image_url ? undefined : "avatar-accent"} src={sizedImage(contact?.image_url, "thumbnail") ?? undefined} alt={name}>
        {name.slice(0, 1).toUpperCase()}
      </Avatar>
      <div className="pd-mobile-bar-price pj-mobile-bar-person">
        <strong>{name}</strong>
        <small>
          <BadgeIcon /> {role}
        </small>
      </div>
      {contact?.phone && (
        <a className="pd-mobile-bar-call" href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>
          <PhoneOutlined /> Call
        </a>
      )}
      {whatsapp && (
        <a
          className="pd-mobile-bar-chat"
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I am interested in your project: ${project.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppOutlined /> WhatsApp
        </a>
      )}
    </div>
  );
}
