"use client";

import { Command } from "cmdk";
import { ArrowRight, Copy, Download, FolderGit2, Hash, Volume2, VolumeX } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/icons";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";
import { play, setSound, soundEnabled } from "@/lib/sound";

export type PaletteData = {
  sections: { id: string; label: string }[];
  projects: { title: string; url: string; summary: string; category: string }[];
};

/**
 * Command palette (SPEC §7, `cmdk`): jump to a section, open any project, copy the email,
 * download either CV, open GitHub/LinkedIn, toggle sound. Loaded only when first opened.
 * cmdk renders a Radix dialog: focus is trapped, Esc closes it and focus returns to where it was.
 */
export default function CommandPalette({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PaletteData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [note, setNote] = useState("");
  const sound = soundEnabled();

  function run(action: () => void, keepOpen = false) {
    play("tick");
    action();
    if (!keepOpen) onOpenChange(false);
  }

  function goToSection(id: string) {
    if (pathname === "/") {
      // Through a real in-page link, so the motion engine's smooth scroll and focus move apply.
      const a = document.createElement("a");
      a.href = `/#${id}`;
      document.body.append(a);
      a.click();
      a.remove();
    } else {
      router.push(`/#${id}`);
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.email);
      setNote(t.palette.copied);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  }

  function download(href: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = "";
    a.click();
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(o) => {
        setNote("");
        onOpenChange(o);
      }}
      label={t.palette.label}
      overlayClassName="palette-overlay"
      contentClassName="palette"
      loop
    >
      <Command.Input placeholder={t.palette.placeholder} className="palette-input" />
      <Command.List className="palette-list" data-lenis-prevent>
        <Command.Empty className="palette-empty">{t.palette.empty}</Command.Empty>

        <Command.Group heading={t.palette.sections}>
          {data.sections.map((s) => (
            <Command.Item
              key={s.id}
              value={`section ${s.label}`}
              onSelect={() => run(() => goToSection(s.id))}
            >
              <Hash size={15} aria-hidden />
              {s.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading={t.palette.projects}>
          {data.projects.map((p) => (
            <Command.Item
              key={p.url}
              value={`project ${p.title} ${p.category} ${p.summary}`}
              onSelect={() => run(() => router.push(p.url))}
            >
              <FolderGit2 size={15} aria-hidden />
              <span className="flex-1 truncate">{p.title}</span>
              <span className="palette-meta">{p.category}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading={t.palette.actions}>
          <Command.Item value="copy email" onSelect={() => run(() => void copyEmail(), true)}>
            <Copy size={15} aria-hidden />
            {t.palette.copyEmail}
          </Command.Item>
          <Command.Item value="cv ai download" onSelect={() => run(() => download(site.cv.ai))}>
            <Download size={15} aria-hidden />
            {t.hero.cvAi}
          </Command.Item>
          <Command.Item
            value="cv embedded iot download"
            onSelect={() => run(() => download(site.cv.embedded))}
          >
            <Download size={15} aria-hidden />
            {t.hero.cvEmbedded}
          </Command.Item>
          <Command.Item
            value="github code"
            onSelect={() => run(() => window.open(site.links.github, "_blank", "noopener"))}
          >
            <GitHubIcon size={15} />
            {t.contact.github}
            <ArrowRight size={14} aria-hidden className="ms-auto opacity-50" />
          </Command.Item>
          {site.links.linkedin && (
            <Command.Item
              value="linkedin"
              onSelect={() => run(() => window.open(site.links.linkedin, "_blank", "noopener"))}
            >
              <LinkedInIcon size={15} />
              {t.contact.linkedin}
              <ArrowRight size={14} aria-hidden className="ms-auto opacity-50" />
            </Command.Item>
          )}
          <Command.Item value="sound audio toggle" onSelect={() => run(() => setSound(!sound))}>
            {sound ? <VolumeX size={15} aria-hidden /> : <Volume2 size={15} aria-hidden />}
            {sound ? t.palette.soundOff : t.palette.soundOn}
          </Command.Item>
        </Command.Group>
      </Command.List>
      <p className="palette-foot" role="status">
        {note || (
          <>
            <kbd>↑</kbd> <kbd>↓</kbd> · <kbd>Enter</kbd> · <kbd>Esc</kbd>
          </>
        )}
      </p>
    </Command.Dialog>
  );
}
