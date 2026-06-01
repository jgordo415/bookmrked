const PRODUCTION_ORIGIN = "https://bookmrked.com";

/**
 * Returns the canonical origin for the app.
 * On the published lovable.app domain (or during SSR), prefers the custom
 * domain bookmrked.com so magic-link / OAuth redirects always land there.
 * On local dev or preview, returns the current origin.
 */
export function getAppOrigin(): string {
  if (typeof window === "undefined") return PRODUCTION_ORIGIN;
  const { origin, hostname } = window.location;
  if (hostname === "bookmrked.com" || hostname === "www.bookmrked.com") {
    return PRODUCTION_ORIGIN;
  }
  // Production lovable.app domain → force custom domain
  if (hostname === "bookmrked.lovable.app") {
    return PRODUCTION_ORIGIN;
  }
  // Preview / dev / id-preview → use current origin
  return origin;
}

export function appUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getAppOrigin()}${p}`;
}