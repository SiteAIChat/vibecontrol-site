export const CTA_LABEL = 'Start with the $47 Blueprint';
// Outcome-led label for the hero and site-wide chrome (nav, sticky CTA).
export const HANDOFF_CTA_LABEL = 'See what I can hand off';
export const BLUEPRINT_URL = '/#get-on-the-list';

export function blueprintUrlForSource(source: string): string {
  return `${BLUEPRINT_URL}?source=${encodeURIComponent(source)}`;
}
