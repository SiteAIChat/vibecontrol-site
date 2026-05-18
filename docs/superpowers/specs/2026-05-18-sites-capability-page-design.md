# `/sites` Capability Page — Design

**Source spec:** `docs/getvibecontrol-sites-v1.md`
**Target route:** `https://getvibecontrol.com/sites`
**Date:** 2026-05-18

## Purpose

Add a new capability showroom page at `/sites` that demonstrates VibeControl's Sites capability (AI-built customer-facing surfaces). The page funnels visitors to the existing `$47 Blueprint` early-access form on the homepage. It is shorter and more focused than the homepage — a stop on the journey, not the destination.

## Goals

1. Ship a `/sites` page that matches the v1 spec (7 sections, copy as written, visual style consistent with homepage).
2. Extract shared chrome (nav, footer, sticky CTA) into reusable Astro components so both pages stay in sync.
3. Tag Sites-driven signups distinctly via a `source=sites` URL parameter, with no schema change to the signup form itself.

## Non-goals

- Real customer screenshots (showroom uses structured placeholders; real images drop in later by swapping the placeholder div for `<img loading="lazy">`).
- `siteai.chat → /sites` 301 redirect (DNS/Cloudflare work, separate task).
- `SoftwareApplication` schema markup (deferred; not load-bearing for v1).
- A/B test variants listed in the source spec.
- A separate signup form on `/sites` (spec explicitly forbids — everyone funnels through the homepage form).

## Architecture

```
src/
├── pages/
│   ├── index.astro              # refactored to use shared components; no visual change
│   └── sites.astro              # new
├── components/
│   ├── SiteNav.astro            # new — extracted from index.astro
│   ├── SiteFooter.astro         # new — extracted from index.astro
│   └── StickyCta.astro          # new — extracted from index.astro
├── lib/
│   └── cta.ts                   # new — CTA constants + source-tagging helper
└── layouts/
    └── Layout.astro             # gains an optional `canonical` prop
```

### Shared components

Each component is self-contained: its own markup, its own script (where applicable). No shared global script. This keeps boundaries clean — a consumer can drop a component in and not worry about wiring up scroll handlers.

- **`SiteNav.astro`** — Top nav. Owns the scroll listener that swaps `data-state="top" | "scrolled"` and toggles shadow classes on itself. No props for v1 (links are hardcoded to known anchors and the external login URL).
- **`SiteFooter.astro`** — Footer with logo, link columns, social icons, Build3r logo. No script. Static markup.
- **`StickyCta.astro`** — Mobile bottom CTA bar. Owns the scroll listener that toggles `translate-y-full` past a 600px threshold. Self-contained.

Each component reads `BLUEPRINT_URL` and `CTA_LABEL` from `src/lib/cta.ts` rather than receiving them as props — these are global constants for the site.

### `src/lib/cta.ts`

```ts
export const CTA_LABEL = 'Start with the $47 Blueprint';
export const BLUEPRINT_URL = '/#get-on-the-list';

export function blueprintUrlForSource(source: string): string {
  return `${BLUEPRINT_URL}?source=${encodeURIComponent(source)}`;
}
```

Page consumers:
- `index.astro` CTAs use `BLUEPRINT_URL` (no source param — form defaults to `vibecontrol-landing`).
- `sites.astro` CTAs use `blueprintUrlForSource('sites')`.

### Source-tagging mechanic

The homepage form has a hidden `<input name="source" value="vibecontrol-landing">`. On `/index.astro`, after the existing form-init script runs, read `URLSearchParams` once on page load: if `source` is present and non-empty, override the hidden input's value before submit. The form's existing fetch to `/api/subscribe` then sends `source: "sites"` in the payload.

This adds ~5 lines to the existing inline script in `index.astro`. No backend change required.

### `Layout.astro` — canonical prop

Add an optional `canonical?: string` prop. When provided, render `<link rel="canonical" href={canonical}>` in `<head>`. Used by `sites.astro` to set the canonical URL per the source spec.

## Page structure — `src/pages/sites.astro`

Inherits the same dark theme, Tailwind tokens, brand-color helpers, and card patterns as the homepage. Roughly half the length of the homepage by section count.

### Section 1 — Hero
Ambient-glow background (same treatment as homepage hero but slightly tighter padding). Eyebrow pill: "Sites · Capability". H1 from spec, broken across two lines with `"AI workforce"` rendered with the brand gradient accent. Subhead from spec. Primary CTA button + small text underneath ("The Blueprint maps the AI workforce…"). No micro-trust row.

### Section 2 — The Shift
Editorial narrative block. H2 from spec. Five paragraphs of body copy, as written in the source spec. No card chrome, no icons — body text on the dark background, generous line-height.

### Section 3 — What gets built (showroom)
The visual heart of the page. Three example cards. Layout: stacked vertically, each card full-width within `max-w-5xl`, generous vertical spacing between. Each card contains:

- Eyebrow label (e.g., "Agency landing page", "Course portal", "Event RSVP page")
- Heading (the bolded title from the spec)
- Neutral placeholder: rounded-2xl div, `aspect-[16/10]`, subtle grid-pattern background (same as homepage's dashboard placeholder), centered label reading `"Screenshot placeholder — [example name]"`
- Annotation caption directly below the placeholder: italicized text from the spec (e.g., "Built in 90 minutes from a brief conversation. Updated 14 times since launch, all by conversation.")

Closing line below all three cards: the "These aren't mockups…" paragraph from the spec.

When real screenshots arrive, replace the placeholder div with `<img src="..." loading="lazy" class="rounded-2xl ..." />`. Annotation captions and surrounding markup are unaffected.

### Section 4 — How it actually works
Three numbered steps. Layout: 3-column on desktop (`md:grid-cols-3`), stacked on mobile. Each step is a card with:
- Numbered circle in brand-blue/brand-teal/brand-orange (matching homepage's numbered-step pattern)
- Step heading from spec
- Body copy from spec

Below the grid: a muted paragraph rendering the "What you don't do" list as comma-flowed prose ("…pick a template, choose fonts, hire a designer, write a brief…").

### Section 5 — Why this matters
Single card-style block (matches homepage Section 8 "Promise" / Section 6 "Founder" in visual treatment). Card contains:
- H2 from spec
- Opening paragraph
- Three parallel "Your business needs X? You don't buy Y. You ask your AI workforce." statements (rendered as bolded short paragraphs for rhythm)
- Closing paragraph
- Primary CTA button + small text underneath

### Section 6 — FAQ
`<details>` accordion pattern, identical structure to homepage Section 10. Seven Q&A pairs as written in the spec.

### Section 7 — Final CTA
Teal-gradient card (matches homepage Section 8 "Promise" treatment). Heading from spec, one paragraph, CTA button, small text underneath ("$47 one-time. 14-day Value Promise…").

## CTA behavior

All CTA buttons on `/sites` link to `blueprintUrlForSource('sites')` → `/#get-on-the-list?source=sites`. Clicking from `/sites`:

1. Browser navigates to `/`, scrolls to `#get-on-the-list`.
2. `index.astro` page-load script reads `URLSearchParams`, finds `source=sites`, overrides the hidden input's value.
3. User submits the form → `/api/subscribe` receives `source: "sites"` in the JSON body.

## SEO

In `sites.astro` `<Layout>` props:
- `title="AI builds your website — VibeControl Sites"`
- `description="Your AI workforce builds and runs your customer-facing surfaces. Landing pages, member portals, forms, storefronts. Part of VibeControl. Start with a $47 Blueprint."`
- `canonical="https://getvibecontrol.com/sites"`

Lazy-loading: when real screenshots are added, use `loading="lazy"` on the `<img>` tags. Placeholders don't need it (they're CSS, not images).

## Testing & verification

Static marketing site — no automated tests. Verification is manual:

1. **Homepage parity:** `npm run dev`, load `/`. Scroll through, confirm visually identical to pre-refactor.
   - Nav state changes on scroll
   - Sticky CTA appears on mobile past hero
   - Form submit still works (try a dummy submit to `/api/subscribe` and confirm 200)
2. **Sites page renders:** Load `/sites`. All 7 sections present, copy matches spec, visuals consistent with homepage.
3. **CTA routing:** Click any CTA on `/sites`. Confirm URL becomes `/#get-on-the-list?source=sites`, page scrolls to form.
4. **Source override:** On the resulting `/` page with `?source=sites`, open devtools and inspect the hidden `source` input — value should be `sites` (not `vibecontrol-landing`).
5. **Form payload:** Submit the form from `/?source=sites` URL with devtools network tab open. Confirm the POST body includes `source: "sites"`.
6. **Mobile sticky CTA:** Both `/` and `/sites` show the sticky bottom bar past hero on a narrow viewport.
7. **Canonical tag:** View source on `/sites`, confirm `<link rel="canonical" href="https://getvibecontrol.com/sites">` is present.

## Implementation phases

**Phase 1 — Extract shared components**
1. Create `src/lib/cta.ts` with constants + helper.
2. Create `SiteNav.astro`, `SiteFooter.astro`, `StickyCta.astro` by lifting markup verbatim from `index.astro`. Each component owns its own scroll script.
3. Refactor `index.astro` to import + use these components. Remove the inline nav/footer/sticky markup and the parts of the shared script those components now own. Form submit + smooth-scroll-on-anchor remain in `index.astro`.
4. Update `BLUEPRINT_URL` reference site-wide to come from `src/lib/cta.ts`.
5. Manual smoke test: homepage renders identically.

**Phase 2 — Build `/sites`**
1. Add `canonical?: string` prop to `Layout.astro`; render `<link rel="canonical">` when present.
2. Create `src/pages/sites.astro` with all 7 sections.
3. Add `URLSearchParams` source-override snippet to `index.astro`'s existing inline script.
4. Manual verification per the testing section above.

## Out of scope (explicit)

- Real customer screenshots in the showroom.
- `siteai.chat → /sites` 301 redirect.
- `SoftwareApplication` schema markup.
- A/B test variants.
- Any change to `/api/subscribe` backend.
- Pricing changes, FAQ changes, or any homepage content changes beyond the refactor.
