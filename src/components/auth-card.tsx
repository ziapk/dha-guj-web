import { CloseOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** The dialog-style card shared by the log in and forgot password pages: logo, close button, heading and intro. */
export function AuthCard({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-close" aria-label="Close and go to the home page">
          <CloseOutlined />
        </Link>
        <Link href="/" className="auth-logo" aria-label="Home">
          <Image src="/brand/logo-wide.png" alt="DHA Gujranwala Properties" width={515} height={160} priority unoptimized />
        </Link>
        <h1 className="auth-title">{title}</h1>
        {intro && <p className="auth-intro">{intro}</p>}
        {children}
      </div>
    </div>
  );
}

/** A thin rule with a short label in the middle ("New here?", "OR"). */
export function AuthDivider({ children }: { children: ReactNode }) {
  return <div className="auth-divider">{children}</div>;
}
