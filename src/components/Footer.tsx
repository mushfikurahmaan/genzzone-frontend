'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Music2,
  Pin,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { StorePublic, StorePublicSocialLinks } from '@/types/akkho';

function formatHeadOffice(s: StorePublic): string | null {
  const addr = s.address?.trim();
  const ctry = s.country?.trim();
  if (addr && ctry) return `${addr}, ${ctry}`;
  return addr || ctry || null;
}

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? `tel:${digits}` : `tel:${digits}`;
}

const SOCIAL_ORDER = [
  'facebook',
  'instagram',
  'twitter',
  'youtube',
  'tiktok',
  'linkedin',
  'pinterest',
  'website',
] as const satisfies readonly (keyof StorePublicSocialLinks)[];

const SOCIAL_ICONS: Record<
  (typeof SOCIAL_ORDER)[number],
  LucideIcon
> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Music2,
  linkedin: Linkedin,
  pinterest: Pin,
  website: Globe,
};

const SOCIAL_LABELS: Record<(typeof SOCIAL_ORDER)[number], string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  website: 'Website',
};

function normalizeExternalUrl(url: string): string {
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

/** Safe href: internal path, or http(s) only (dashboard-controlled). */
function resolveSocialHref(url: string): { href: string; external: boolean } | null {
  const t = url.trim();
  if (!t) return null;
  if (t.startsWith('/') && !t.startsWith('//')) {
    return { href: t, external: false };
  }
  const href = normalizeExternalUrl(t);
  if (!/^https?:\/\//i.test(href)) return null;
  return { href, external: true };
}

function getSocialEntries(
  links: StorePublic['social_links']
): { key: (typeof SOCIAL_ORDER)[number]; href: string; external: boolean; Icon: LucideIcon; label: string }[] {
  if (!links || typeof links !== 'object') return [];
  const out: {
    key: (typeof SOCIAL_ORDER)[number];
    href: string;
    external: boolean;
    Icon: LucideIcon;
    label: string;
  }[] = [];
  for (const key of SOCIAL_ORDER) {
    const raw = (links as Record<string, unknown>)[key];
    const url = typeof raw === 'string' ? raw.trim() : '';
    if (!url) continue;
    const resolved = resolveSocialHref(url);
    if (!resolved) continue;
    out.push({
      key,
      ...resolved,
      Icon: SOCIAL_ICONS[key],
      label: SOCIAL_LABELS[key],
    });
  }
  return out;
}

export function Footer({ storePublic }: { storePublic?: StorePublic | null }) {
  const headOffice = storePublic ? formatHeadOffice(storePublic) : null;
  const email = storePublic?.support_email?.trim() || null;
  const phone = storePublic?.phone?.trim() || null;
  const socialEntries = getSocialEntries(storePublic?.social_links);

  return (
    <footer className="footer">
      <div className="container-main footer-container">
        <div className="footer-grid">
          {/* Logo & Contact Info */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Image
                src="/media/genzzone.jpg"
                alt="GenZZone Logo"
                width={144}
                height={144}
                className="footer-logo-img"
              />
              <div className="flex flex-col">
                <span className="logo-gen">GEN-Z</span>
                <span className="logo-zone">ZONE</span>
              </div>
            </div>
            <div className="footer-contact-wrap">
              {headOffice ? (
                <div className="footer-contact-item">
                  <MapPin className="footer-contact-icon" />
                  <div>
                    <span className="font-semibold">HEAD OFFICE:</span>
                    <p className="mt-1 whitespace-pre-line">{headOffice}</p>
                  </div>
                </div>
              ) : null}
              {email ? (
                <div className="footer-contact-item">
                  <Mail className="footer-contact-icon" />
                  <div>
                    <span className="font-semibold">EMAIL:</span>
                    <p className="mt-1">
                      <a
                        href={`mailto:${email}`}
                        className="footer-link underline-offset-2 hover:underline"
                      >
                        {email}
                      </a>
                    </p>
                  </div>
                </div>
              ) : null}
              {phone ? (
                <div className="footer-contact-item">
                  <Phone className="footer-contact-icon" />
                  <div>
                    <span className="font-semibold">PHONE:</span>
                    <p className="mt-1">
                      <a
                        href={telHref(phone)}
                        className="footer-link underline-offset-2 hover:underline"
                      >
                        {phone}
                      </a>
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Customer & Information Links */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="footer-heading">CUSTOMER</h3>
              <div className="space-y-2 text-sm">
                <Link href="/account" className="footer-link">Account</Link>
                <span className="footer-link-disabled">Cart</span>
                <Link href="/wishlist" className="footer-link">Wishlist</Link>
                <Link href="/blog" className="footer-link">Blog</Link>
              </div>
            </div>
            <div>
              <h3 className="footer-heading">INFORMATION</h3>
              <div className="space-y-2 text-sm">
                <Link href="/about-us" className="footer-link">About us</Link>
                <Link href="/contact-us" className="footer-link">Contact Us</Link>
                <Link href="/privacy-policy" className="footer-link">Privacy Policy</Link>
                <Link href="/refund-policy" className="footer-link">Return & Refund</Link>
                <Link href="/cancellation-policy" className="footer-link">Cancellation Policy</Link>
              </div>
            </div>
          </div>

          {/* Social Links — from `store/public` → social_links */}
          {socialEntries.length > 0 ? (
            <div>
              <h3 className="footer-heading">SOCIAL LINKS</h3>
              <div className="flex flex-wrap items-center gap-4">
                {socialEntries.map(({ key, href, external, Icon, label }) =>
                  external ? (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link text-foreground"
                      aria-label={label}
                    >
                      <Icon className="w-5 h-5" aria-hidden />
                    </a>
                  ) : (
                    <Link
                      key={key}
                      href={href}
                      className="social-link text-foreground"
                      aria-label={label}
                    >
                      <Icon className="w-5 h-5" aria-hidden />
                    </Link>
                  )
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="footer-credit">
          <p className="w-full text-center">
            © 2026 Gen-Z Zone. All rights reserved. | Developed by{' '}
            <a
              href="https://mushfikurahmaan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-credit-link"
            >
              Mushfikur Rahman
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
