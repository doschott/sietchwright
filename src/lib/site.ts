/** Canonical public URL. Share and docs always point here, not localhost. */
export const SITE_URL = "https://sietchwright.com";
export const SITE_HOST = "sietchwright.com";
export const GITHUB_URL = "https://github.com/doschott/sietchwright";

/**
 * URL to put on a tweet or copy-link. Always the production domain so a local
 * or preview session still shares a link the community can open.
 */
export function sharePageUrl(): string {
  return SITE_URL;
}

export function shareIntentUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 900))}`;
}
