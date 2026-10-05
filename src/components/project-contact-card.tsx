"use client";

import { MailOutlined, PhoneOutlined, ShareAltOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { App, Avatar, Button } from "antd";
import { useState } from "react";
import { BadgeIcon } from "@/components/icons";
import { whatsappNumber } from "@/lib/property";
import type { PublicProject } from "@/types/api";

/** The project's sales contact: who they are, Call / WhatsApp side by side, then email and share. */
export function ProjectContactCard({ project }: { project: PublicProject }) {
  const { message } = App.useApp();
  const [revealed, setRevealed] = useState(false);
  const contact = project.contact;
  const name = contact?.name ?? project.developer_name;
  const whatsapp = whatsappNumber(contact?.whatsapp);

  async function share() {
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title: project.name, url }).catch(() => undefined);

      return;
    }

    await navigator.clipboard.writeText(url);
    message.success("Link copied to clipboard");
  }

  return (
    <div className="contact-card pd-contact">
      <div className="pd-contact-person">
        <Avatar size={56} className="avatar-accent">
          {name.slice(0, 1).toUpperCase()}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <strong>{name}</strong>
          {contact?.office && <small className="pj-contact-office">{contact.office}</small>}
        </div>
      </div>

      <span className="pd-contact-role">
        <BadgeIcon /> {contact?.name && contact.name !== project.developer_name ? `Sales for ${project.developer_name}` : "Project Developer"}
      </span>

      {(contact?.phone || whatsapp) && (
        <div className="pd-contact-buttons">
          {contact?.phone &&
            (revealed ? (
              <Button icon={<PhoneOutlined />} href={`tel:${contact.phone}`} className="pd-call">
                {contact.phone}
              </Button>
            ) : (
              <Button icon={<PhoneOutlined />} className="pd-call" aria-label="Show phone number" onClick={() => setRevealed(true)}>
                Call
              </Button>
            ))}
          {whatsapp && (
            <Button
              className="pd-whatsapp"
              icon={<WhatsAppOutlined />}
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I am interested in your project: ${project.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </Button>
          )}
        </div>
      )}

      <div className="pj-contact-links">
        {contact?.email && (
          <Button type="text" size="small" icon={<MailOutlined />} href={`mailto:${contact.email}?subject=${encodeURIComponent(`Inquiry: ${project.name}`)}`}>
            Email
          </Button>
        )}
        <Button type="text" size="small" icon={<ShareAltOutlined />} onClick={share}>
          Share
        </Button>
      </div>
    </div>
  );
}
