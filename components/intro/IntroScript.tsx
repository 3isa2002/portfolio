/**
 * Decides the intro mode before the first paint (an inline script runs while the HTML is parsed),
 * so a returning visitor never sees a flash of the overlay. Sets `<html data-intro>` to:
 *   full  — first visit to the home page: the 3.2 s boot sequence (stores intro_seen=1 at once,
 *           so it never plays twice in a row, even after a reload mid-way)
 *   short — return visit: 600 ms name scramble only
 *   calm  — prefers-reduced-motion: no intro, the hero fades in
 * Without JavaScript the script never runs and there is no overlay at all.
 */
const script = `(function(){var d=document.documentElement,m="short";try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)m="calm";else if(!localStorage.getItem("intro_seen")){m="full";localStorage.setItem("intro_seen","1")}}catch(e){m="calm"}d.setAttribute("data-intro",m)})()`;

export function IntroScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
