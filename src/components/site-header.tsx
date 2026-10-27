"use client";

import { BellOutlined, FileSearchOutlined, HeartOutlined, HomeOutlined, LogoutOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Dropdown } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ComponentType, useEffect, useState } from "react";
import {
  BuildingIcon,
  ChevronRightIcon,
  CloseIcon,
  DocumentIcon,
  HomeIcon,
  KeyIcon,
  MapIcon,
  MenuIcon,
  PhoneIcon,
  PlusCircleIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { useSession } from "@/components/session-provider";
import { SiteLogo } from "@/components/site-logo";
import { MAIN_NAV } from "@/lib/navigation";
import { whatsappNumber } from "@/lib/property";
import { portalUrl } from "@/lib/site";
import { useThemeSettings } from "@/theme/theme-provider";
import type { SiteSettings } from "@/types/api";

type NavLink = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const NAV_ICONS: Record<(typeof MAIN_NAV)[number]["href"], NavLink["icon"]> = {
  "/properties-for-sale": HomeIcon,
  "/properties-for-rent": KeyIcon,
  "/projects": BuildingIcon,
  "/developers": UsersIcon,
  "/dha-gujranwala-maps": MapIcon,
  "/dealers": UserIcon,
  "/dha-gujranwala-files-rates": DocumentIcon,
};

/** The main menu (design: header-image.png); the mobile panel shows the same links with icons (nav-responsive.png). */
const LINKS: NavLink[] = MAIN_NAV.map((link) => ({ ...link, icon: NAV_ICONS[link.href] }));

const SELL_PROPERTY_HREF = "/sell-property";

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** The round account button, or the logged-in buyer's menu. */
function AccountMenu() {
  const { user } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <Link href="/login" className="icon-button header-account" aria-label="Log in">
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
      <button type="button" className="icon-button header-account" aria-label={`Account menu for ${user.name}`}>
        <Avatar size={30} className="avatar-accent">
          {user.name.slice(0, 1).toUpperCase()}
        </Avatar>
      </button>
    </Dropdown>
  );
}

/** Account links at the foot of the mobile panel. */
function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useSession();

  if (!user) {
    return (
      <Link href="/login" onClick={onNavigate}>
        <UserIcon className="icon" /> Log in
      </Link>
    );
  }

  return (
    <>
      <Link href="/account/favorites" onClick={onNavigate}>
        <HeartOutlined /> My favourites
      </Link>
      <Link href="/account/saved-searches" onClick={onNavigate}>
        <BellOutlined /> Saved searches
      </Link>
      <Link href="/account/requirements" onClick={onNavigate}>
        <FileSearchOutlined /> My requirements
      </Link>
    </>
  );
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const siteName = settings.general.site_name ?? "DHA GUJ Properties";
  const phone = settings.contact.phone;
  const whatsapp = whatsappNumber(settings.contact.whatsapp);
  const pathname = usePathname();
  const { resolvedMode, toggleMode } = useThemeSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const close = () => setMenuOpen(false);

  // The open panel covers the page: stop the page behind it from scrolling, and let Escape close it.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className={`site-header${menuOpen ? " menu-open" : ""}`} id="top">
      <div className="container site-header-inner">
        <SiteLogo siteName={siteName} logoUrl={settings.general.logo_url} onClick={close} />

        <nav className="site-nav" aria-label="Main">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={isActive(link.href) ? "active" : undefined} aria-current={isActive(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          <span className="site-actions-divider hide-mobile" aria-hidden="true" />

          <Link className="header-pill header-pill-outline hide-mobile" href={SELL_PROPERTY_HREF}>
            <TagIcon className="icon" /> Sell Property
          </Link>
          <a className="header-pill header-pill-solid hide-mobile" href={portalUrl("/listings/new")}>
            <PlusCircleIcon className="icon" /> Add Property
          </a>

          {phone && (
            <a className="icon-button header-call" href={telHref(phone)} aria-label={`Call ${phone}`}>
              <PhoneIcon className="icon" />
            </a>
          )}
          {whatsapp && (
            <a className="icon-button header-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp (opens in a new tab)">
              <WhatsAppIcon className="icon" />
            </a>
          )}

          <span className="hide-mobile">
            <AccountMenu />
          </span>

          <button
            type="button"
            className="header-menu-toggle show-mobile"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon className="icon" /> : <MenuIcon className="icon" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu">
          <div className="container">
            <nav className="mobile-menu-links" aria-label="Mobile">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={close} aria-current={isActive(href) ? "page" : undefined}>
                  <Icon className="icon" />
                  <span>{label}</span>
                  <ChevronRightIcon className="icon mobile-menu-chevron" />
                </Link>
              ))}
            </nav>

            <div className="mobile-menu-ctas">
              <Link className="mobile-menu-cta mobile-menu-sell" href={SELL_PROPERTY_HREF} onClick={close}>
                <TagIcon className="icon" />
                <span>Sell Property</span>
                <ChevronRightIcon className="icon mobile-menu-chevron" />
              </Link>
              <a className="mobile-menu-cta mobile-menu-add" href={portalUrl("/listings/new")}>
                <PlusCircleIcon className="icon" />
                <span>Add Property</span>
                <ChevronRightIcon className="icon mobile-menu-chevron" />
              </a>
            </div>

            {(phone || whatsapp) && (
              <div className="mobile-menu-contact">
                {phone && (
                  <a href={telHref(phone)} aria-label={`Call ${phone}`}>
                    <span className="mobile-menu-contact-icon is-call">
                      <PhoneIcon className="icon" />
                    </span>
                    Call Us
                  </a>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp (opens in a new tab)">
                    <span className="mobile-menu-contact-icon is-whatsapp">
                      <WhatsAppIcon className="icon" />
                    </span>
                    WhatsApp
                  </a>
                )}
              </div>
            )}

            <div className="mobile-menu-extra">
              <MobileAccountLinks onNavigate={close} />
              <button type="button" onClick={toggleMode}>
                {resolvedMode === "dark" ? <SunOutlined /> : <MoonOutlined />} {resolvedMode === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
