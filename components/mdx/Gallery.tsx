"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { Picture } from "@/components/ui/Picture";
import { t } from "@/lib/i18n";

export type GalleryItem = { src: string; caption: string; width: number; height: number };

/**
 * Project gallery (SPEC §6 "Media"): a masonry of thumbnails and a lightbox.
 * The lightbox is a native modal <dialog>: focus is trapped inside, Esc closes it and focus
 * returns to the thumbnail. Arrow keys and swipes move between images; the zoom button or a
 * double-click zooms to 2× at the clicked point. Images come from the frontmatter `gallery`
 * (width/height read at build time, so the masonry never shifts while loading).
 */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const count = items.length;
  const item = items[index];

  function open(i: number) {
    setIndex(i);
    setZoom(null);
    dialog.current?.showModal();
  }
  function go(step: number) {
    setZoom(null);
    setIndex((i) => (i + step + count) % count);
  }

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(document.dir === "rtl" ? -1 : 1);
      if (e.key === "ArrowLeft") go(document.dir === "rtl" ? 1 : -1);
    };
    d.addEventListener("keydown", onKey);
    return () => d.removeEventListener("keydown", onKey);
  });

  function toggleZoom(e?: MouseEvent<HTMLElement>) {
    if (zoom) return setZoom(null);
    const r = e?.currentTarget.getBoundingClientRect();
    setZoom(
      e && r
        ? { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
        : { x: 50, y: 50 },
    );
  }

  function onPointerDown(e: PointerEvent) {
    swipe.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: PointerEvent) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || zoom) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(dx < 0 ? 1 : -1);
  }

  if (count === 0) return null;

  return (
    <div className="not-prose">
      <ul aria-label={t.gallery.label} className="gallery">
        {items.map((g, i) => (
          <li key={g.src}>
            <figure>
              <button
                type="button"
                onClick={() => open(i)}
                aria-label={`${t.gallery.open}: ${g.caption || i + 1}`}
                className="gallery-thumb card block w-full overflow-hidden"
              >
                <Picture
                  src={g.src}
                  alt={g.caption}
                  width={g.width}
                  height={g.height}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full transition-transform duration-500 ease-out-expo hover:scale-[1.03]"
                />
              </button>
              {g.caption && (
                <figcaption className="mt-2 font-mono text-xs text-dim">{g.caption}</figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={t.gallery.label}
        data-lenis-prevent
        onClose={() => setZoom(null)}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      >
        {item && (
          <div className="flex size-full flex-col">
            <div className="flex items-center gap-2 p-3">
              <span className="font-mono text-xs text-dim" aria-live="polite">
                {index + 1} {t.gallery.of} {count}
              </span>
              <button
                type="button"
                className="lightbox-btn ms-auto"
                onClick={() => toggleZoom()}
                aria-label={zoom ? t.gallery.zoomOut : t.gallery.zoomIn}
              >
                {zoom ? <ZoomOut size={18} aria-hidden /> : <ZoomIn size={18} aria-hidden />}
              </button>
              <button
                type="button"
                className="lightbox-btn"
                onClick={() => dialog.current?.close()}
                aria-label={t.gallery.close}
                autoFocus
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <figure
              className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-3 pb-4 sm:px-16"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              <div
                className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
                onDoubleClick={toggleZoom}
              >
                <Picture
                  key={item.src}
                  src={item.src}
                  alt={item.caption}
                  width={item.width}
                  height={item.height}
                  sizes="100vw"
                  className="lightbox-img max-h-full max-w-full object-contain"
                  style={{
                    transform: zoom ? "scale(2)" : undefined,
                    transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : undefined,
                    cursor: zoom ? "zoom-out" : "zoom-in",
                  }}
                />
              </div>
              {item.caption && (
                <figcaption className="text-center text-sm text-dim">{item.caption}</figcaption>
              )}
              {count > 1 && (
                <>
                  <button
                    type="button"
                    className="lightbox-btn lightbox-nav start-2"
                    onClick={() => go(-1)}
                    aria-label={t.gallery.previous}
                  >
                    <ChevronLeft size={22} aria-hidden className="rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    className="lightbox-btn lightbox-nav end-2"
                    onClick={() => go(1)}
                    aria-label={t.gallery.next}
                  >
                    <ChevronRight size={22} aria-hidden className="rtl:rotate-180" />
                  </button>
                </>
              )}
            </figure>
          </div>
        )}
      </dialog>
    </div>
  );
}
