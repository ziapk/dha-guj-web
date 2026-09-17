"use client";

import { MailOutlined, PhoneOutlined, ShareAltOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { App, Avatar, Button } from "antd";
import { useState } from "react";
import { whatsappNumber } from "@/lib/property";
import type { PublicProject } from "@/types/api";

/** Call, WhatsApp and email buttons for a developer project. */
export function ProjectContactCard({ project }: { project: PublicProject }) {
  const { message } = App.useApp();
  const [revealed, setRevealed] = useState(false);
  const contact = project.contact;
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
    <div className="contact-card">
      <div className="contact-person">
        <Avatar size={48} className="avatar-accent">
          {(contact?.name ?? project.developer_name).slice(0, 1).toUpperCase()}
        </Avatar>
        <div>
          <strong>{contact?.name ?? project.developer_name}</strong>
          <small>{contact?.name && contact.name !== project.developer_name ? `For ${project.developer_name}` : "Developer"}</small>
        </div>
      </div>

      {contact?.phone &&
        (revealed ? (
          <Button type="primary" size="large" block icon={<PhoneOutlined />} href={`tel:${contact.phone}`}>
            {contact.phone}
          </Button>
        ) : (
          <Button type="primary" size="large" block icon={<PhoneOutlined />} onClick={() => setRevealed(true)}>
            Show phone number
          </Button>
        ))}

      {whatsapp && (
        <Button
          size="large"
          block
          className="btn-whatsapp"
          icon={<WhatsAppOutlined />}
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I am interested in your project: ${project.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat on WhatsApp
        </Button>
      )}

      {contact?.email && (
        <Button size="large" block icon={<MailOutlined />} href={`mailto:${contact.email}?subject=${encodeURIComponent(`Inquiry: ${project.name}`)}`}>
          Email the developer
        </Button>
      )}

      <Button type="text" block icon={<ShareAltOutlined />} onClick={share}>
        Share this project
      </Button>
    </div>
  );
}
