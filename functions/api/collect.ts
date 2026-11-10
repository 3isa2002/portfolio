/**
 * Visit collector — a Cloudflare Pages Function at POST /api/collect.
 *
 * The site itself stays a static export; this is the one piece that runs on Cloudflare. The beacon
 * (public/v.js) posts page views and a few events here; this adds what only the server knows (IP,
 * location and network from Cloudflare, device from the User-Agent) and writes one row per visit
 * and one per event into the D1 database bound as `DB`.
 *
 * - Write-only: it never returns stored data. Reading happens in the private portal.
 * - Without the `DB` binding (previews, local static server) it answers 204 and stores nothing.
 * - The tables are created on first use, so setup is: create a D1 database, bind it as `DB`.
 * - Limits: same-origin posts only, 2 KB bodies, 30 new visits per IP per hour, 400 events per
 *   visit.
 *
 * No Cloudflare type package is installed (SPEC §2: no new dependencies), so the few platform
 * types used are declared here.
 */

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
}
interface D1Database {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
}
interface Env {
  DB?: D1Database;
}
interface Context {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

const MAX_BODY = 2048;
const VISITS_PER_IP_PER_HOUR = 30;
const EVENTS_PER_VISIT = 400;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** page view · time on a page · CV download · contact link · other outbound link. */
const TYPES = ["page", "leave", "cv", "contact", "out"] as const;
type EventType = (typeof TYPES)[number];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    visitor TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    last_at INTEGER NOT NULL,
    ip TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    lat REAL,
    lon REAL,
    tz TEXT,
    asn INTEGER,
    org TEXT,
    ua TEXT,
    device TEXT,
    os TEXT,
    browser TEXT,
    bot INTEGER NOT NULL DEFAULT 0,
    screen TEXT,
    lang TEXT,
    referrer TEXT,
    source TEXT,
    ref TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    landing TEXT,
    pageviews INTEGER NOT NULL DEFAULT 0,
    events INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit TEXT NOT NULL,
    at INTEGER NOT NULL,
    type TEXT NOT NULL,
    path TEXT NOT NULL,
    data TEXT,
    ms INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS visits_started ON visits (started_at)`,
  `CREATE INDEX IF NOT EXISTS visits_ip ON visits (ip, started_at)`,
  `CREATE INDEX IF NOT EXISTS visits_visitor ON visits (visitor)`,
  `CREATE INDEX IF NOT EXISTS events_visit ON events (visit, at)`,
];

const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

const str = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.length > 0 ? value.slice(0, max) : null;

const num = (value: unknown): number | null => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

const ID = /^[A-Za-z0-9-]{8,40}$/;
const TAG = /^[\w.-]{1,64}$/;

/** Device, OS and browser from the User-Agent: enough to tell a phone from a laptop. */
function parseUserAgent(ua: string) {
  const device = /iPad|Tablet/i.test(ua)
    ? "tablet"
    : /Mobi|Android|iPhone|iPod/i.test(ua)
      ? "mobile"
      : "desktop";
  const os = /Windows NT/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "Other";
  // In-app browsers first: a link opened inside LinkedIn says a lot about who is looking.
  const browser = /LinkedInApp/i.test(ua)
    ? "LinkedIn app"
    : /FBAN|FBAV|FB_IAB/.test(ua)
      ? "Facebook app"
      : /Instagram/.test(ua)
        ? "Instagram app"
        : /Edg(e|A|iOS)?\//.test(ua)
          ? "Edge"
          : /OPR\/|Opera/.test(ua)
            ? "Opera"
            : /SamsungBrowser\//.test(ua)
              ? "Samsung Internet"
              : /Firefox\/|FxiOS\//.test(ua)
                ? "Firefox"
                : /Chrome\/|CriOS\//.test(ua)
                  ? "Chrome"
                  : /Safari\//.test(ua)
                    ? "Safari"
                    : "Other";
  const bot =
    ua.length < 20 ||
    /bot|crawl|spider|slurp|lighthouse|pagespeed|headless|puppeteer|playwright|phantom|preview|scan|monitor|uptime|curl|wget|python|node-fetch|axios/i.test(
      ua,
    );
  return { device, os, browser, bot };
}

/** Where the visit came from: a campaign tag, a known site, the referring host, or "direct". */
function sourceOf(referrer: string | null, utm: string | null, ua: string, host: string) {
  if (utm) return utm.toLowerCase();
  let from = "";
  try {
    from = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
  } catch {
    // Not a URL: treated as no referrer.
  }
  if (from === host.replace(/^www\./, "")) from = "";
  if (!from) {
    // In-app browsers often send no referrer, but they name themselves.
    if (/LinkedInApp/i.test(ua)) return "linkedin";
    if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
    if (/Instagram/i.test(ua)) return "instagram";
    return "direct";
  }
  const known: [RegExp, string][] = [
    [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
    [/(^|\.)google\./, "google"],
    [/(^|\.)bing\.com$/, "bing"],
    [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
    [/(^|\.)github\.com$/, "github"],
    [/(^|\.)(facebook|fb)\.com$|^fb\.me$/, "facebook"],
    [/(^|\.)instagram\.com$/, "instagram"],
    [/(^|\.)(twitter|x)\.com$|^t\.co$/, "x"],
    [/(^|\.)whatsapp\.com$|^wa\.me$/, "whatsapp"],
    [/(^|\.)telegram\.org$|^t\.me$/, "telegram"],
    [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
  ];
  return known.find(([pattern]) => pattern.test(from))?.[1] ?? from;
}

export async function onRequestPost({ request, env, waitUntil }: Context): Promise<Response> {
  const url = new URL(request.url);

  // Same-origin posts only (the beacon). Anything else gets the same empty answer.
  const origin = request.headers.get("Origin");
  const sameOrigin = origin
    ? origin === url.origin
    : request.headers.get("Sec-Fetch-Site") === "same-origin";
  if (!sameOrigin) return done();
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) return done();

  const raw = await request.text();
  if (raw.length > MAX_BODY) return done();
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return done();
    body = parsed as Record<string, unknown>;
  } catch {
    return done();
  }

  const visitor = str(body.v, 40);
  const visit = str(body.s, 40);
  const type: EventType | undefined = TYPES.find((t) => t === body.t);
  const path = str(body.p, 200);
  if (!visitor || !visit || !type || !path) return done();
  if (!ID.test(visitor) || !ID.test(visit) || !path.startsWith("/")) return done();

  const data = str(body.d, 200);
  const spent = num(body.ms);
  const ms = spent !== null && spent >= 0 && spent <= DAY ? Math.round(spent) : null;

  // Sent with page views: what only the browser knows about where the visit came from.
  const meta =
    typeof body.m === "object" && body.m !== null ? (body.m as Record<string, unknown>) : {};
  const tag = (value: unknown) => {
    const s = str(value, 64);
    return s && TAG.test(s) ? s : null;
  };
  const referrer = str(meta.ref, 300);
  const ref = tag(meta.r);
  const utmSource = tag(meta.us);
  const screen = str(meta.scr, 11);

  const db = env.DB;
  if (!db) return done();

  const ua = (request.headers.get("User-Agent") ?? "").slice(0, 300);
  const agent = parseUserAgent(ua);
  const cf = (request as Request & { cf?: Record<string, unknown> }).cf ?? {};
  const ip = request.headers.get("CF-Connecting-IP");
  const now = Date.now();

  const write = () =>
    db.batch([
      // 1. The visit row, created by the first event of a session.
      db
        .prepare(
          `INSERT OR IGNORE INTO visits (
             id, visitor, started_at, last_at, ip, country, region, city, lat, lon, tz, asn, org,
             ua, device, os, browser, bot, screen, lang, referrer, source, ref,
             utm_source, utm_medium, utm_campaign, landing
           )
           SELECT ?1, ?2, ?3, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
                  ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26
           WHERE (SELECT COUNT(*) FROM visits WHERE ip IS ?4 AND started_at > ?27) < ?28`,
        )
        .bind(
          visit,
          visitor,
          now,
          ip,
          str(cf.country, 2),
          str(cf.region, 80),
          str(cf.city, 80),
          num(cf.latitude),
          num(cf.longitude),
          str(cf.timezone, 64),
          num(cf.asn),
          str(cf.asOrganization, 120),
          ua,
          agent.device,
          agent.os,
          agent.browser,
          agent.bot || meta.wd === true ? 1 : 0,
          screen && /^\d{2,5}x\d{2,5}$/.test(screen) ? screen : null,
          str(meta.lang, 16),
          referrer,
          sourceOf(referrer, utmSource, ua, url.hostname),
          ref,
          utmSource,
          tag(meta.um),
          tag(meta.uc),
          path,
          now - HOUR,
          VISITS_PER_IP_PER_HOUR,
        ),
      // 2. The event, while the visit is under its cap.
      db
        .prepare(
          `INSERT INTO events (visit, at, type, path, data, ms)
           SELECT ?1, ?2, ?3, ?4, ?5, ?6
           WHERE EXISTS (SELECT 1 FROM visits WHERE id = ?1 AND events < ?7)`,
        )
        .bind(visit, now, type, path, data, ms, EVENTS_PER_VISIT),
      // 3. The visit's running totals.
      db
        .prepare(
          `UPDATE visits
           SET last_at = ?2, events = events + 1, pageviews = pageviews + ?3,
               duration_ms = duration_ms + ?4
           WHERE id = ?1 AND events < ?5`,
        )
        .bind(
          visit,
          now,
          type === "page" ? 1 : 0,
          type === "leave" ? (ms ?? 0) : 0,
          EVENTS_PER_VISIT,
        ),
    ]);

  waitUntil(
    write().catch(async (error: unknown) => {
      // First event ever: the tables do not exist yet. Create them and try once more.
      if (!String(error).includes("no such table")) throw error;
      await db.batch(SCHEMA.map((statement) => db.prepare(statement)));
      await write();
    }),
  );
  return done();
}
