/**
 * Draws the intro's name scramble on a <canvas>, exactly over the real hero heading: same font,
 * letter-spacing, line breaks and gradient. A canvas is never a Largest Contentful Paint
 * candidate, so the intro cannot push LCP back to ~3 s the way a large text copy would; the real
 * heading underneath stays the LCP element, painted at first paint.
 *
 * Returns a draw function for progress 0..1 (characters resolve left to right), or null when
 * the heading cannot be measured.
 */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CYAN = "#22d3ee";
const VIOLET = "#8b5cf6";

type Line = {
  start: number;
  end: number;
  left: number;
  right: number;
  top: number;
  height: number;
};

export function nameScramble(
  canvas: HTMLCanvasElement,
  heading: HTMLElement,
): ((progress: number) => void) | null {
  const span = heading.querySelector("span") ?? heading;
  const node = span.firstChild;
  const ctx = canvas.getContext("2d");
  if (!ctx || !(node instanceof Text)) return null;
  const text = node.data;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.scale(dpr, dpr);

  const style = getComputedStyle(span);
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
  ctx.textBaseline = "alphabetic";

  // Group characters into the heading's real line boxes (the name wraps on phones).
  const range = document.createRange();
  const lines: Line[] = [];
  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getBoundingClientRect();
    const last = lines[lines.length - 1];
    if (!last || Math.abs(r.top - last.top) > r.height / 2) {
      lines.push({
        start: i,
        end: i + 1,
        left: r.left,
        right: r.right,
        top: r.top,
        height: r.height,
      });
    } else {
      last.end = i + 1;
      if (text[i] !== " ") last.right = Math.max(last.right, r.right);
    }
  }
  if (lines.length === 0) return null;
  const ascent = ctx.measureText("M").fontBoundingBoxAscent;

  // The heading's gradient is one 135° gradient across the inline span; wrapped fragments are
  // painted as if laid side by side (box-decoration-break: slice), so each line gets its slice.
  const total = lines.reduce((sum, l) => sum + (l.right - l.left), 0);
  let offset = 0;
  const fills = lines.map((l) => {
    const x = l.left - offset;
    offset += l.right - l.left;
    const half = ((total + l.height) * Math.SQRT1_2) / 2;
    const cx = x + total / 2;
    const cy = l.top + l.height / 2;
    const d = half * Math.SQRT1_2;
    const g = ctx.createLinearGradient(cx - d, cy - d, cx + d, cy + d);
    g.addColorStop(0, CYAN);
    g.addColorStop(1, VIOLET);
    return g;
  });

  return (progress: number) => {
    ctx.clearRect(0, 0, w, h);
    lines.forEach((l, li) => {
      let s = "";
      for (let i = l.start; i < l.end; i++) {
        const ch = text[i] ?? "";
        const resolved = ch === " " || progress >= 0.3 + (i / text.length) * 0.7;
        s += resolved ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      ctx.fillStyle = fills[li] ?? CYAN;
      ctx.fillText(s.trimEnd(), l.left, l.top + ascent);
    });
  };
}
