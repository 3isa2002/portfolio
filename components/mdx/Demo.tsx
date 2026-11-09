"use client";

import dynamic from "next/dynamic";
import { t } from "@/lib/i18n";

const loading = () => (
  <p className="grid h-[420px] place-items-center font-mono text-xs text-dim">{t.demo.loading}</p>
);

/**
 * Interactive demos (SPEC §6): browser-only components in components/demos/, each in its own
 * chunk, loaded only on a page that uses it. Use from frontmatter (`demo: "reply-twin"`) or
 * in MDX (`<Demo name="iot-dashboard" />`). Add a demo by adding a line here.
 */
const demos = {
  "reply-twin": dynamic(() => import("@/components/demos/ReplyTwinDemo"), { loading }),
  "iot-dashboard": dynamic(() => import("@/components/demos/IotDashboardDemo"), { loading }),
} as const;

export function Demo({ name }: { name: string }) {
  const Component = demos[name as keyof typeof demos];
  if (!Component) return null;
  return (
    <div className="not-prose demo card overflow-hidden">
      <Component />
    </div>
  );
}
