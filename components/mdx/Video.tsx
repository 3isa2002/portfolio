"use client";

import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Picture } from "@/components/ui/Picture";
import { t } from "@/lib/i18n";

type VideoProps = {
  /** A video file URL, or a YouTube video ID. Resolved by the case-study page. */
  src: string;
  /** Poster image (defaults to the project cover). */
  poster: string;
  /** WebVTT captions file for a video file (SPEC §8: captions on demo videos). */
  captions?: string;
  title: string;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Case-study video (SPEC §6 "Media"): a custom player that loads nothing heavy until needed.
 * - YouTube ID: a poster facade; the youtube-nocookie iframe is created only on click, so no
 *   request goes to YouTube before the visitor asks for it.
 * - Video file: `preload="none"` until the player is near the viewport, then metadata only;
 *   play/pause, seek, time, mute and full screen controls; optional captions track.
 */
export function Video({ src, poster, captions, title }: VideoProps) {
  if (!src) return null;
  return YOUTUBE_ID.test(src) ? (
    <YouTube id={src} poster={poster} title={title} />
  ) : (
    <FilePlayer src={src} poster={poster} captions={captions} title={title} />
  );
}

function PosterButton({
  poster,
  label,
  onClick,
}: {
  poster: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute inset-0 size-full"
      aria-label={label}
    >
      <Picture
        src={poster}
        alt=""
        width={1600}
        height={1000}
        sizes="(min-width: 1280px) 1184px, 100vw"
        className="size-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-[image:var(--gradient)] text-bg shadow-[0_0_32px_-4px_var(--violet)] transition-transform duration-300 ease-out-expo group-hover:scale-110">
          <Play size={26} aria-hidden className="translate-x-0.5" />
        </span>
      </span>
    </button>
  );
}

function YouTube({ id, poster, title }: { id: string; poster: string; title: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="not-prose card relative aspect-video overflow-hidden">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <PosterButton
          poster={poster}
          label={`${t.video.youtube}: ${title}`}
          onClick={() => setOn(true)}
        />
      )}
    </div>
  );
}

function FilePlayer({ src, poster, captions, title }: Omit<VideoProps, "src"> & { src: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Only fetch metadata once the player is close to the viewport.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), {
      rootMargin: "300px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function start() {
    setStarted(true);
    setNear(true);
    requestAnimationFrame(() => void video.current?.play());
  }
  function toggle() {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }

  return (
    <div ref={frame} className="not-prose card relative aspect-video overflow-hidden bg-black">
      <video
        ref={video}
        src={near ? src : undefined}
        preload={near ? "metadata" : "none"}
        playsInline
        muted={muted}
        aria-label={title}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="absolute inset-0 size-full object-contain"
      >
        {captions && <track kind="captions" src={captions} srcLang="en" label="English" default />}
      </video>

      {!started && (
        <PosterButton poster={poster} label={`${t.video.play}: ${title}`} onClick={start} />
      )}

      {started && (
        <div className="video-controls absolute inset-x-0 bottom-0 flex items-center gap-2 p-2 sm:gap-3 sm:p-3">
          <button
            type="button"
            className="lightbox-btn"
            onClick={toggle}
            aria-label={playing ? t.video.pause : t.video.resume}
          >
            {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
          </button>
          <span className="font-mono text-xs text-text tabular-nums">
            {format(time)} / {format(duration)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            aria-label={t.video.seek}
            onChange={(e) => {
              const v = video.current;
              if (v) v.currentTime = Number(e.target.value);
            }}
            className="video-seek min-w-0 flex-1"
          />
          <button
            type="button"
            className="lightbox-btn"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? t.video.unmute : t.video.mute}
          >
            {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
          </button>
          <button
            type="button"
            className="lightbox-btn"
            onClick={() => void frame.current?.requestFullscreen?.()}
            aria-label={t.video.fullscreen}
          >
            <Maximize size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

function format(s: number): string {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}
