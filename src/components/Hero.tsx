import Image from "next/image";
import Link from "next/link";
import type { StorefrontBanner } from "@/types/akkho";

interface HeroProps {
  /** Absolute image URL (from server fetch). */
  imageUrl?: string | null;
  /** When no image, show title / CTA from the first storefront banner if present. */
  banner?: StorefrontBanner | null;
  alt?: string;
}

function bannerHasTextContent(banner: StorefrontBanner | null | undefined): boolean {
  if (!banner) return false;
  return Boolean(
    banner.title?.trim() ||
      banner.cta_text?.trim() ||
      banner.cta_url?.trim()
  );
}

export function Hero({
  imageUrl,
  banner,
  alt = "Hero banner",
}: HeroProps) {
  const showImage = Boolean(imageUrl);
  const showTextHero = !showImage && bannerHasTextContent(banner);

  return (
    <section className="hero" aria-label="Hero banner">
      {showImage ? (
        <Image
          src={imageUrl!}
          alt={alt}
          width={1920}
          height={1080}
          className="hero-img"
          priority
          unoptimized={imageUrl!.includes(
            process.env.NEXT_PUBLIC_API_URL || ""
          )}
        />
      ) : showTextHero ? (
        <div className="hero-text-banner">
          {banner!.title?.trim() ? (
            <h2 className="hero-text-banner-title">{banner!.title.trim()}</h2>
          ) : null}
          {banner!.cta_text?.trim() ? (
            <p className="hero-text-banner-text">{banner!.cta_text.trim()}</p>
          ) : null}
          {banner!.cta_url?.trim() ? (
            <Link
              href={banner!.cta_url.trim()}
              className="hero-text-banner-link inline-block mt-2 underline font-medium"
            >
              {banner!.cta_text?.trim() ? "Learn more" : "Shop now"}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="hero-placeholder" />
      )}
    </section>
  );
}
