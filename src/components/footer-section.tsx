"use client";

import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { type ReactNode, useId, useState } from "react";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { useThemeSettings } from "@/theme/theme-provider";

/**
 * A footer column. On desktop it is a plain heading over its links; on phones the heading becomes a row that
 * opens and closes the links (design: footer-responsive.png, "Mobile Version 2").
 */
export function FooterSection({ title, icon, className, children }: { title: string; icon: ReactNode; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div className={`footer-section${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}>
      <h2>
        <button type="button" className="footer-section-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((value) => !value)}>
          <span className="footer-section-icon">{icon}</span>
          <span className="footer-section-title">{title}</span>
          <span className="footer-section-sign">{open ? <MinusIcon className="icon" /> : <PlusIcon className="icon" />}</span>
        </button>
      </h2>
      <div className="footer-section-body" id={bodyId}>
        {children}
      </div>
    </div>
  );
}

/** Light / dark switch in the footer bar (the header has no room for it in the design). */
export function FooterThemeToggle() {
  const { resolvedMode, toggleMode } = useThemeSettings();

  return (
    <button type="button" className="footer-theme-toggle" onClick={toggleMode}>
      {resolvedMode === "dark" ? <SunOutlined /> : <MoonOutlined />} {resolvedMode === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
