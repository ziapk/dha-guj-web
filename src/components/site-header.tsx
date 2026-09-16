"use client";

import { BellOutlined, FileSearchOutlined, HeartOutlined, HomeFilled, HomeOutlined, LogoutOutlined, MailOutlined, MenuOutlined, MoonOutlined, PhoneOutlined, PlusOutlined, SunOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Drawer, Dropdown, Tooltip } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/session-provider";
import { ContactList, SocialLinks } from "@/components/site-contact";
import { SiteLogo } from "@/components/site-logo";
import { whatsappNumber } from "@/lib/property";
import { portalUrl } from "@/lib/site";
import { useThemeSettings } from "@/theme/theme-provider";
import type { SiteSettings } from "@/types/api";

const LINKS = [
  { href: "/properties?purpose=sale", label: "Buy" },
  { href: "/properties?purpose=rent", label: "Rent" },
  { href: "/properties?category=plot", label: "Plots" },
  { href: "/properties?category=commercial", label: "Commercial" },
  { href: "/agencies", label: "Agencies" },
  { href: "/wanted", label: "Wanted" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

/** Log in button, or the logged-in buyer's menu. */
function AccountMenu() {
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <Link href="/login" className="hide-mobile">
        <Button>Log in</Button>
      </Link>
    );
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.setQueryData(["me"], null);
    queryClient.removeQueries({ queryKey: ["favorite-ids"] });
    router.refresh();
  }

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items: [
          { key: "favorites", icon: <HeartOutlined />, label: <Link href="/account/favorites">My favourites</Link> },
          { key: "searches", icon: <BellOutlined />, label: <Link href="/account/saved-searches">Saved searches</Link> },
          { key: "requirements", icon: <FileSearchOutlined />, label: <Link href="/account/requirements">My requirements</Link> },
          { key: "portal", icon: <HomeOutlined />, label: <a href={portalUrl("/")}>Property Admin</a> },
          { type: "divider" },
          { key: "logout", icon: <LogoutOutlined />, label: "Log out", danger: true, onClick: logout },
        ],
      }}
    >
      <button type="button" className="user-trigger hide-mobile" aria-label="Account menu">
        <Avatar size="small" className="avatar-accent">
          {user.name.slice(0, 1).toUpperCase()}
        </Avatar>
        <span>{user.name.split(" ")[0]}</span>
      </button>
    </Dropdown>
  );
}

function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useSession();

  if (!user) {
    return (
      <Link href="/login" onClick={onNavigate}>
        <Button size="large" block>
          Log in
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/account/favorites" onClick={onNavigate}>
        <Button size="large" block icon={<HeartOutlined />}>
          My favourites
        </Button>
      </Link>
      <Link href="/account/saved-searches" onClick={onNavigate}>
        <Button size="large" block icon={<BellOutlined />}>
          Saved searches
        </Button>
      </Link>
      <Link href="/account/requirements" onClick={onNavigate}>
        <Button size="large" block icon={<FileSearchOutlined />}>
          My requirements
        </Button>
      </Link>
    </>
  );
}

/** Slim bar above the header with the phone, WhatsApp and email from site settings (desktop only; mobile shows them in the menu). */
function TopBar({ settings }: { settings: SiteSettings }) {
  const { contact, general } = settings;
  const whatsapp = whatsappNumber(contact.whatsapp);

  if (!contact.phone && !whatsapp && !contact.email) {
    return null;
  }

  return (
    <div className="site-topbar hide-mobile">
      <div className="container site-topbar-inner">
        {general.tagline ? <span className="site-topbar-tagline">{general.tagline}</span> : <span />}
        <ul>
          {contact.office_hours && <li className="site-topbar-hours">{contact.office_hours}</li>}
          {contact.phone && (
            <li>
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${contact.phone}`}>
                <PhoneOutlined aria-hidden /> {contact.phone}
              </a>
            </li>
          )}
          {whatsapp && (
            <li>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${contact.whatsapp} (opens in a new tab)`}>
                <WhatsAppOutlined aria-hidden /> WhatsApp
              </a>
            </li>
          )}
          {contact.email && (
            <li>
              <a href={`mailto:${contact.email}`} aria-label={`Email ${contact.email}`}>
                <MailOutlined aria-hidden /> {contact.email}
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const siteName = settings.general.site_name ?? "DHA GUJ Properties";
  const pathname = usePathname();
  const { resolvedMode, toggleMode } = useThemeSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => !href.includes("?") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <TopBar settings={settings} />
      <header className="site-header">
        <div className="container site-header-inner">
          <SiteLogo siteName={siteName} logoUrl={settings.general.logo_url} icon={<HomeFilled />} />

          <nav className="site-nav" aria-label="Main">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={isActive(link.href) ? "active" : undefined} aria-current={isActive(link.href) ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="site-actions">
            <Tooltip title={resolvedMode === "dark" ? "Light mode" : "Dark mode"}>
              <Button type="text" aria-label="Toggle dark mode" icon={resolvedMode === "dark" ? <SunOutlined /> : <MoonOutlined />} onClick={toggleMode} />
            </Tooltip>
            <AccountMenu />
            <Button type="primary" href={portalUrl("/listings/new")} icon={<PlusOutlined />} className="hide-mobile">
              Post a property
            </Button>
            <Button type="text" aria-label="Open menu" icon={<MenuOutlined />} className="show-mobile" onClick={() => setMenuOpen(true)} />
          </div>
        </div>

        <Drawer title="Menu" placement="right" size={290} open={menuOpen} onClose={() => setMenuOpen(false)}>
          <nav className="mobile-nav" aria-label="Mobile">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <Button type="primary" size="large" block href={portalUrl("/listings/new")} icon={<PlusOutlined />}>
              Post a property
            </Button>
            <MobileAccountLinks onNavigate={() => setMenuOpen(false)} />
          </div>
          <div className="mobile-contact">
            <ContactList contact={settings.contact} />
            <SocialLinks social={settings.social} siteName={siteName} />
          </div>
        </Drawer>
      </header>
    </>
  );
}
