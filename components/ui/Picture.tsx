import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { avifLoader, webpLoader } from "@/lib/image-loader";

type PictureProps = {
  src: string;
  alt: string;
  /** Intrinsic size; sets the aspect ratio so the image never causes layout shift. */
  width: number;
  height: number;
  /** Responsive `sizes` hint, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  /** Above-the-fold images: eager load + high fetch priority (LCP). */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Responsive image with AVIF + WebP sources from the build-time pipeline.
 * Works in both server and client components.
 */
export function Picture({
  src,
  alt,
  width,
  height,
  sizes,
  priority,
  className,
  style,
}: PictureProps) {
  const common = { src, alt, width, height, sizes, priority };
  const { props: avif } = getImageProps({ ...common, loader: avifLoader });
  const { props: webp } = getImageProps({ ...common, loader: webpLoader });

  return (
    // `contents`: the <img> sizes against the parent box, so `size-full` works through <picture>.
    <picture className="contents">
      <source type="image/avif" srcSet={avif.srcSet} sizes={sizes} />
      <img {...webp} alt={alt} className={className} style={{ ...webp.style, ...style }} />
    </picture>
  );
}
