"use client";

import { CloseOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuthModal } from "@/components/auth-modal";

/** The dialog-style card shared by the log in and forgot password pages and modals: logo, close button, heading and intro. */
export function AuthCard({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  const modal = useAuthModal();

  const card = (
    <div className="auth-card">
      {modal ? (
        <button type="button" className="auth-close" aria-label="Close" onClick={modal.close}>
          <CloseOutlined />
        </button>
      ) : (
        <Link href="/" className="auth-close" aria-label="Close and go to the home page">
          <CloseOutlined />
        </Link>
      )}
      <Link href="/" className="auth-logo" aria-label="Home">
        <Image src="/brand/logo-wide.png" alt="DHA Gujranwala Properties" width={515} height={160} priority unoptimized />
      </Link>
      <h1 className="auth-title">{title}</h1>
      {intro && <p className="auth-intro">{intro}</p>}
      {children}
    </div>
  );

  return modal ? card : <div className="auth-page">{card}</div>;
}

/** A thin rule with a short label in the middle ("New here?", "OR"). */
export function AuthDivider({ children }: { children: ReactNode }) {
  return <div className="auth-divider">{children}</div>;
}
