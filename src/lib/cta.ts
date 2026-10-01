export const CTA_LABEL = 'Start with the $47 Blueprint';
// Outcome-led label for the hero and site-wide chrome (nav, sticky CTA).
export const HANDOFF_CTA_LABEL = 'See what I can hand off';
// Hand-off buttons scroll to the homepage's "How you get started" section.
export const HANDOFF_URL = '/#get-started';
export const BLUEPRINT_URL = '/#get-on-the-list';

export function blueprintUrlForSource(source: string): string {
  return `${BLUEPRINT_URL}?source=${encodeURIComponent(source)}`;
}

// Free website review + $47 Working Interview on fire-your-website.com,
// tagged with this site as the source and which button sent the visitor.
export function reviewUrlFor(placement: string): string {
  return `https://fire-your-website.com/?utm_source=getvibecontrol&utm_medium=referral&utm_content=${encodeURIComponent(placement)}#review-form`;
}
