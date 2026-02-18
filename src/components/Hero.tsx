import Image from "next/image";

interface HeroProps {
  /** Absolute image URL (from server fetch). Omit for placeholder. */
  imageUrl?: string | null;
  alt?: string;
}

export function Hero({ imageUrl, alt = "Hero banner" }: HeroProps) {
  return (
    <section className="hero" aria-label="Hero banner">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          width={1920}
          height={1080}
          className="hero-img"
          priority
          unoptimized={imageUrl.includes(process.env.NEXT_PUBLIC_API_URL || "")}
        />
      ) : (
        <div className="hero-placeholder" />
      )}
    </section>
  );
}
