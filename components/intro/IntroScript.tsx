/**
 * Decides the intro mode before the first paint (an inline script runs while the HTML is parsed),
 * so the page never flashes before the overlay. Sets `<html data-intro>` to:
 *   full  — every load of the home page: the 3.2 s boot sequence (Mohamed's decision,
 *           2026-11-09: on every visit, not only the first)
 *   calm  — prefers-reduced-motion: no intro, the hero fades in
 * Without JavaScript the script never runs and there is no overlay at all.
 */
const script = `(function(){var d=document.documentElement,m="full";try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)m="calm"}catch(e){m="calm"}d.setAttribute("data-intro",m)})()`;

export function IntroScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
