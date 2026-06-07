/**
 * Single Yjs entry for the app + room-kit. Import from here (or @the-idea-guy/room-kit/yjs)
 * so Next/webpack never bundles two copies — see https://github.com/yjs/yjs/issues/438
 */
import * as Y from "yjs";

export { Y };
export default Y;

/** Duck-type check — safe even when instanceof would fail across duplicate bundles. */
export function isYMap(value: unknown): value is Y.Map<unknown> {
  return (
    value != null &&
    typeof (value as Y.Map<unknown>).get === "function" &&
    typeof (value as Y.Map<unknown>).set === "function"
  );
}
