"use client";

import { BellOutlined, FileSearchOutlined, HeartOutlined, HomeOutlined, LogoutOutlined, MenuOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Drawer, Dropdown, Tooltip } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { HomeIcon, PhoneIcon, UserIcon } from "@/components/icons";
import { useSession } from "@/components/session-provider";
import { ContactList, SocialLinks } from "@/components/site-contact";
import { SiteLogo } from "@/components/site-logo";
import { portalUrl } from "@/lib/site";
import { useThemeSettings } from "@/theme/theme-provider";
import type { SiteSettings } from "@/types/api";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/maps", label: "Maps" },
  { href: "/agencies", label: "Dealers" },
  { href: "/agents", label: "Agents" },
  { href: "/dha-gujranwala-files-rates", label: "File Rates" },
  { href: "/blog", label: "Blog" },
];

/** The links that only appear in the mobile drawer, where there is room for the full site. */
const MORE_LINKS = [
  { href: "/properties?purpose=sale", label: "Buy" },
  { href: "/properties?purpose=rent", label: "Rent" },
  { href: "/properties?category=plot", label: "Plots" },
  { href: "/properties?category=commercial", label: "Commercial" },
  { href: "/wanted", label: "Wanted" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about-us", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

/** The round account button, or the logged-in buyer's menu. */
function AccountMenu() {
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <Link href="/login" className="icon-button hide-mobile" aria-label="Log in">
        <UserIcon className="icon" />
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

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const siteName = settings.general.site_name ?? "DHA GUJ Properties";
  const phone = settings.contact.phone;
  const pathname = usePathname();
  const { resolvedMode, toggleMode } = useThemeSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="site-header" id="top">
      <div className="container site-header-inner">
        <SiteLogo siteName={siteName} logoUrl={settings.general.logo_url} icon={<HomeIcon />} />

        <nav className="site-nav" aria-label="Main">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={isActive(link.href) ? "active" : undefined} aria-current={isActive(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          <Tooltip title={resolvedMode === "dark" ? "Light mode" : "Dark mode"}>
            <button type="button" className="icon-button" aria-label="Toggle dark mode" onClick={toggleMode}>
              {resolvedMode === "dark" ? <SunOutlined /> : <MoonOutlined />}
            </button>
          </Tooltip>

          <a className="pill-link hide-mobile" href={portalUrl("/listings/new")}>
            <HomeIcon className="icon" /> List Property
          </a>

          {phone && (
            <>
              <span className="site-actions-divider hide-mobile" aria-hidden="true" />
              <a className="phone-pill hide-mobile" href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${phone}`}>
                <PhoneIcon className="icon" /> {phone}
              </a>
            </>
          )}

          <AccountMenu />

          <button type="button" className="icon-button show-mobile" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <MenuOutlined />
          </button>
        </div>
      </div>

      <Drawer title="Menu" placement="right" size={290} open={menuOpen} onClose={() => setMenuOpen(false)}>
        <nav className="mobile-nav" aria-label="Mobile">
          {[...LINKS, ...MORE_LINKS].map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <Button type="primary" size="large" block href={portalUrl("/listings/new")}>
            List Property
          </Button>
          <MobileAccountLinks onNavigate={() => setMenuOpen(false)} />
        </div>
        <div className="mobile-contact">
          <ContactList contact={settings.contact} />
          <SocialLinks social={settings.social} siteName={siteName} />
        </div>
      </Drawer>
    </header>
  );
}
