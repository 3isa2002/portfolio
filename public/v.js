/*
 * Visit beacon. Posts page views and a few events (time on a page, CV downloads, contact and
 * outbound links) to /api/collect, a Cloudflare Pages Function that stores them for the private
 * visits portal (functions/api/collect.ts).
 *
 * Plain JS on purpose: it is not part of the app bundle, loads with `defer` and waits for the
 * page to be idle, so it costs the page nothing.
 *
 * - No cookies. A random visitor id lives in localStorage and a visit id in sessionStorage (a new
 *   visit after 30 minutes away).
 * - /?notrack=1 turns it off on this browser for good (Mohamed's own devices); /?notrack=0 turns
 *   it back on.
 * - Off on localhost, where there is no collector, unless localStorage "vdev" is "1" (tests).
 */
(function () {
  "use strict";

  var ENDPOINT = "/api/collect";
  var AWAY = 30 * 60 * 1000;

  function read(store, key) {
    try {
      return window[store].getItem(key);
    } catch {
      return null;
    }
  }
  function write(store, key, value) {
    try {
      if (value === null) window[store].removeItem(key);
      else window[store].setItem(key, value);
    } catch {
      // Storage blocked (private mode): the ids then last for this page only.
    }
  }
  function newId() {
    try {
      return crypto.randomUUID();
    } catch {
      return "x" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
    }
  }

  var query = new URLSearchParams(location.search);
  if (query.get("notrack") === "1") write("localStorage", "novisit", "1");
  if (query.get("notrack") === "0") write("localStorage", "novisit", null);
  if (read("localStorage", "novisit") === "1") return;

  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (local && read("localStorage", "vdev") !== "1") return;

  var visitor = read("localStorage", "vid");
  if (!visitor) {
    visitor = newId();
    write("localStorage", "vid", visitor);
  }

  var memory = "";
  function visit() {
    var now = Date.now();
    var saved = (read("sessionStorage", "vs") || memory).split("|");
    var id = saved[0] && now - Number(saved[1]) < AWAY ? saved[0] : newId();
    memory = id + "|" + now;
    write("sessionStorage", "vs", memory);
    return id;
  }

  // Where the visit came from, read once: the landing URL's tags and the outside referrer.
  var meta = {
    ref: document.referrer || undefined,
    r: query.get("r") || undefined,
    us: query.get("utm_source") || undefined,
    um: query.get("utm_medium") || undefined,
    uc: query.get("utm_campaign") || undefined,
    scr: screen.width + "x" + screen.height,
    lang: navigator.language,
    wd: navigator.webdriver === true || undefined,
  };

  function send(type, path, data, ms) {
    var body = JSON.stringify({
      v: visitor,
      s: visit(),
      t: type,
      p: path,
      d: data,
      ms: ms,
      m: type === "page" ? meta : undefined,
    });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return;
      fetch(ENDPOINT, { method: "POST", body: body, keepalive: true }).catch(function () {});
    } catch {
      // Never let statistics break the page.
    }
  }

  // Time on the current page, counted only while the tab is visible.
  var path = location.pathname;
  var visibleSince = document.visibilityState === "visible" ? performance.now() : null;
  function leave() {
    if (visibleSince === null) return;
    var ms = Math.min(performance.now() - visibleSince, AWAY);
    visibleSince = document.visibilityState === "visible" ? performance.now() : null;
    if (ms >= 500) send("leave", path, undefined, Math.round(ms));
  }
  function page() {
    path = location.pathname;
    if (document.visibilityState === "visible") visibleSince = performance.now();
    send("page", path);
  }
  function moved() {
    // After the router has updated the URL. Query-only changes (the project filter) do not count.
    setTimeout(function () {
      if (location.pathname === path) return;
      leave();
      page();
    }, 0);
  }

  function start() {
    page();

    ["pushState", "replaceState"].forEach(function (name) {
      var original = history[name];
      history[name] = function () {
        var result = original.apply(this, arguments);
        moved();
        return result;
      };
    });
    addEventListener("popstate", moved);

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") leave();
      else visibleSince = performance.now();
    });
    addEventListener("pagehide", leave);
    // Back from the back/forward cache: the same document, a new view.
    addEventListener("pageshow", function (event) {
      if (event.persisted) page();
    });

    function clicked(event) {
      var target = event.target;
      var link = target && target.closest ? target.closest("a[href]") : null;
      if (!link) return;
      var to;
      try {
        to = new URL(link.href, location.href);
      } catch {
        return;
      }
      if (to.protocol === "mailto:") return send("contact", path, "email");
      if (!/^https?:$/.test(to.protocol)) return;
      if (/\.pdf$/i.test(to.pathname)) {
        return send("cv", path, to.pathname.split("/").pop());
      }
      if (to.host === location.host) return;
      var host = to.hostname.replace(/^www\./, "");
      if (/(^|\.)linkedin\.com$/.test(host)) return send("contact", path, "linkedin");
      if (host === "github.com" && to.pathname.split("/").filter(Boolean).length === 1) {
        return send("contact", path, "github");
      }
      send("out", path, (host + to.pathname).slice(0, 200));
    }
    document.addEventListener("click", clicked, true);
    document.addEventListener("auxclick", clicked, true);
  }

  // For actions that are not a link click (the command palette's CV download).
  window.visitEvent = function (type, data) {
    send(type, path, data);
  };

  function whenIdle() {
    if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 3000 });
    else setTimeout(start, 1);
  }
  if (document.readyState === "complete") whenIdle();
  else addEventListener("load", whenIdle);
})();
