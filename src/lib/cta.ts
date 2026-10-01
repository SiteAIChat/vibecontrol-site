export const CTA_LABEL = 'Start with the $47 Blueprint';
// Primary path: free website review, then the $47 Working Interview, on
// fire-your-website.com. Used by the hero and site-wide chrome (nav, sticky CTA).
export const REVIEW_URL = 'https://fire-your-website.com';
export const REVIEW_CTA_LABEL = 'See it work on my website';
export const BLUEPRINT_URL = '/#get-on-the-list';

export function blueprintUrlForSource(source: string): string {
  return `${BLUEPRINT_URL}?source=${encodeURIComponent(source)}`;
}
