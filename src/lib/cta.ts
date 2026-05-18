export const CTA_LABEL = 'Start with the $47 Blueprint';
export const BLUEPRINT_URL = '/#get-on-the-list';

export function blueprintUrlForSource(source: string): string {
  return `${BLUEPRINT_URL}?source=${encodeURIComponent(source)}`;
}
