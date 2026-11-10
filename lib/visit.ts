/**
 * Reports an action to the visit beacon (public/v.js) for things it cannot see by itself, i.e.
 * anything that is not a click on a link in the page. Does nothing when the beacon is off
 * (localhost, or a browser opted out with /?notrack=1).
 */
export function visitEvent(type: "cv" | "contact" | "out", data?: string) {
  const beacon = (window as Window & { visitEvent?: (type: string, data?: string) => void })
    .visitEvent;
  beacon?.(type, data);
}
