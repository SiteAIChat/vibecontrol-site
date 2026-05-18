# `/sites` Capability Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a new `/sites` capability showroom page on getvibecontrol.com that funnels visitors to the existing `$47 Blueprint` early-access form, while extracting shared nav/footer/sticky CTA from the homepage into reusable Astro components.

**Architecture:** Two phases. Phase 1 refactors `src/pages/index.astro` to source its nav, footer, and mobile sticky CTA from `src/components/*.astro`, and centralizes CTA constants in `src/lib/cta.ts`. Phase 2 adds `src/pages/sites.astro` using those components, plus a small `URLSearchParams` snippet on the homepage that tags Sites-driven signups via `?source=sites`.

**Tech Stack:** Astro 5, React 19 (for icon components only — `lucide-react`), Tailwind CSS 3.4 with custom `brand-*` colors (blue/teal/orange/coral). Static site output. No test runner — verification is `npm run build` (catches imports/syntax) plus manual browser checks via `npm run dev`.

**Source spec:** `docs/superpowers/specs/2026-05-18-sites-capability-page-design.md`

**Reference content:** `docs/getvibecontrol-sites-v1.md` (copy for `/sites` — use exactly as written).

---

## Working notes

- Existing chrome lives in `src/pages/index.astro`. Reference line ranges in current file:
  - **Nav:** lines 39–69
  - **Footer:** lines 781–830
  - **Sticky CTA bar:** lines 833–845
  - **Inline script block:** lines 847–936, containing:
    - Nav scroll-state + sticky CTA reveal logic (~lines 848–878)
    - Smooth-scroll-on-anchor-click (~lines 880–891)
    - Form submit handler (~lines 893–935)
- Tailwind safelists `brand-*` color utilities and opacity variants — see `tailwind.config.mjs`. Stick to these brand colors for consistency.
- Icons come from `lucide-react`. Import only what you use. JSX-style usage works directly in `.astro` files because of `@astrojs/react`.
- After every code change in a task, run `npm run build` before committing. A green build catches missing imports, bad paths, and syntax errors before browser testing.

---

## File Structure

**Files created:**
- `src/lib/cta.ts` — CTA constants (`BLUEPRINT_URL`, `CTA_LABEL`) + `blueprintUrlForSource(source)` helper.
- `src/components/SiteNav.astro` — Top nav with self-contained scroll-state script.
- `src/components/SiteFooter.astro` — Static footer markup.
- `src/components/StickyCta.astro` — Mobile bottom CTA bar with self-contained scroll-reveal script.
- `src/pages/sites.astro` — New `/sites` page, 7 sections per source spec.

**Files modified:**
- `src/pages/index.astro` — Imports new components; removes inline nav/footer/sticky markup; removes scroll-state code from inline script (form submit + smooth scroll remain); adds `URLSearchParams`-based source override to form init.
- `src/layouts/Layout.astro` — Adds optional `canonical?: string` and `ogUrl?: string` props; defaults preserve current behavior.

---

# Phase 1 — Extract shared chrome

Phase 1 must leave the homepage visually and behaviorally identical to its current state. The output is a refactor with zero user-facing change.

---

### Task 1: Create CTA constants module

**Files:**
- Create: `src/lib/cta.ts`

- [ ] **Step 1: Create `src/lib/cta.ts`**

```ts
export const CTA_LABEL = 'Start with the $47 Blueprint';
export const BLUEPRINT_URL = '/#get-on-the-list';

export function blueprintUrlForSource(source: string): string {
  return `${BLUEPRINT_URL}?source=${encodeURIComponent(source)}`;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: Build succeeds. No new errors. (The file isn't imported yet, but the build will type-check it.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/cta.ts
git commit -m "Add shared CTA constants module"
```

---

### Task 2: Create `SiteNav.astro` component

Lifts the top nav markup from `index.astro` lines 39–69 verbatim, plus the nav-state portion of the existing scroll script.

**Files:**
- Create: `src/components/SiteNav.astro`

- [ ] **Step 1: Create `src/components/SiteNav.astro`**

```astro
---
import { ArrowRight } from 'lucide-react';
import { BLUEPRINT_URL, CTA_LABEL } from '../lib/cta';
---
<header
  id="site-nav"
  class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
  data-state="top"
>
  <div class="bg-gray-950/70 backdrop-blur-md border-b border-white/5 supports-[backdrop-filter]:bg-gray-950/60">
    <div class="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between gap-4">
      <nav class="hidden md:flex items-center gap-8 text-sm text-gray-300">
        <a href="/#pricing" class="hover:text-white transition">Pricing</a>
        <a href="/#founder" class="hover:text-white transition">About</a>
        <a href="https://vibecontrol.app/login" class="hover:text-white transition">Login</a>
      </nav>
      <div class="md:hidden">
        <a href="#top" class="sr-only">VibeControl</a>
      </div>
      <a
        href={BLUEPRINT_URL}
        class="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-blue to-brand-teal text-sm font-semibold text-white hover:opacity-90 transition shadow-lg shadow-brand-blue/20"
      >
        {CTA_LABEL}
        <ArrowRight className="w-4 h-4" />
      </a>
      <a
        href={BLUEPRINT_URL}
        class="sm:hidden inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-brand-blue to-brand-teal text-xs font-semibold text-white"
      >
        $47 Blueprint
      </a>
    </div>
  </div>
</header>

<script>
  const nav = document.getElementById('site-nav');
  if (nav) {
    let ticking = false;
    function onScroll() {
      const y = window.scrollY;
      nav.dataset.state = y > 40 ? 'scrolled' : 'top';
      nav.classList.toggle('shadow-lg', y > 40);
      nav.classList.toggle('shadow-black/20', y > 40);
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(onScroll);
          ticking = true;
        }
      },
      { passive: true },
    );
    onScroll();
  }
</script>
```

> Note: The nav links `#pricing` and `#founder` use the absolute form `/#pricing` and `/#founder` so they work from both `/` and `/sites`.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. Component isn't used yet, but it must type-check.

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteNav.astro
git commit -m "Add SiteNav component"
```

---

### Task 3: Create `SiteFooter.astro` component

Lifts the footer markup from `index.astro` lines 781–830 verbatim. Pure markup, no script.

**Files:**
- Create: `src/components/SiteFooter.astro`

- [ ] **Step 1: Create `src/components/SiteFooter.astro`**

```astro
---
import { BLUEPRINT_URL } from '../lib/cta';
---
<footer class="border-t border-white/10 py-14 px-6">
  <div class="max-w-6xl mx-auto">
    <div class="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-10 items-start">
      <div>
        <img src="/images/logo-light.png" alt="VibeControl" class="w-full max-w-[16rem] h-auto" />
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Product</p>
        <ul class="space-y-3 text-sm">
          <li><a href="/#pricing" class="text-gray-400 hover:text-white transition">Pricing</a></li>
          <li><a href="https://vibecontrol.app/login" class="text-gray-400 hover:text-white transition">Login</a></li>
          <li><a href={BLUEPRINT_URL} class="text-gray-400 hover:text-white transition">$47 Blueprint</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Company</p>
        <ul class="space-y-3 text-sm">
          <li><a href="/#founder" class="text-gray-400 hover:text-white transition">About</a></li>
          <li><a href="https://build3r.io" class="text-gray-400 hover:text-white transition">Build3r (Agency)</a></li>
          <li><a href="/terms" class="text-gray-400 hover:text-white transition">Terms &amp; Privacy</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Support</p>
        <ul class="space-y-3 text-sm">
          <li><a href="/help" class="text-gray-400 hover:text-white transition">Help Center</a></li>
          <li><a href="mailto:hello@getvibecontrol.com" class="text-gray-400 hover:text-white transition">Contact</a></li>
        </ul>
      </div>
    </div>

    <div class="pt-8 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-gray-500">
      <p>&copy; {new Date().getFullYear()} BUILD3R LLC. All rights reserved. A Build3r product · Built by Dustin Randle and team.</p>
      <div class="flex items-center gap-4">
        <a href="https://youtube.com/@dustinrandle" target="_blank" rel="noopener noreferrer" class="text-gray-500 hover:text-white transition" aria-label="YouTube">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" /><path d="M9.545 15.568V8.432L15.818 12z" fill="#0a0a0a" /></svg>
        </a>
        <a href="https://x.com/TheDustinRandle" target="_blank" rel="noopener noreferrer" class="text-gray-500 hover:text-white transition" aria-label="X">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
        </a>
        <a href="https://tiktok.com/@thedustinrandle" target="_blank" rel="noopener noreferrer" class="text-gray-500 hover:text-white transition" aria-label="TikTok">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
        </a>
        <a href="https://build3r.io" class="ml-2" aria-label="Build3r">
          <img src="/images/build3r-logo-white.png" alt="BUILD3R" class="h-5 opacity-60 hover:opacity-100 transition" />
        </a>
      </div>
    </div>
  </div>
</footer>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteFooter.astro
git commit -m "Add SiteFooter component"
```

---

### Task 4: Create `StickyCta.astro` component

Lifts the mobile sticky bar markup from `index.astro` lines 833–845 plus the sticky-reveal portion of the existing scroll script.

**Files:**
- Create: `src/components/StickyCta.astro`

- [ ] **Step 1: Create `src/components/StickyCta.astro`**

```astro
---
import { ArrowRight } from 'lucide-react';
import { BLUEPRINT_URL, CTA_LABEL } from '../lib/cta';

interface Props {
  href?: string;
}

const { href = BLUEPRINT_URL } = Astro.props;
---
<div
  id="sticky-cta"
  class="md:hidden fixed bottom-0 inset-x-0 z-40 translate-y-full transition-transform duration-300 px-4 pb-4"
>
  <a
    href={href}
    class="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-teal font-semibold text-white shadow-2xl shadow-brand-blue/40"
  >
    {CTA_LABEL}
    <ArrowRight className="w-4 h-4" />
  </a>
</div>

<script>
  const stickyCta = document.getElementById('sticky-cta');
  const HERO_THRESHOLD = 600;
  if (stickyCta) {
    let ticking = false;
    function onScroll() {
      const y = window.scrollY;
      const show = y > HERO_THRESHOLD;
      stickyCta.classList.toggle('translate-y-full', !show);
      stickyCta.classList.toggle('translate-y-0', show);
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(onScroll);
          ticking = true;
        }
      },
      { passive: true },
    );
    onScroll();
  }
</script>
```

> Note: An optional `href` prop lets `/sites` pass `blueprintUrlForSource('sites')`. Defaults to homepage `BLUEPRINT_URL` so `index.astro` doesn't need to change behavior.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/StickyCta.astro
git commit -m "Add StickyCta component"
```

---

### Task 5: Refactor `index.astro` to use shared components

This is the riskiest task — touch the homepage. Work in three sub-edits: imports, markup replacement, script trim. Build between sub-edits if you want extra safety.

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace the top of the frontmatter imports**

Open `src/pages/index.astro`. The current frontmatter (lines 1–31) imports many icons and defines local CTA constants. Replace lines 1–31 with:

```astro
---
import Layout from '../layouts/Layout.astro';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';
import StickyCta from '../components/StickyCta.astro';
import { BLUEPRINT_URL, CTA_LABEL } from '../lib/cta';
import {
  ArrowRight,
  Check,
  X,
  Inbox,
  PhoneCall,
  HeartHandshake,
  PenLine,
  BarChart3,
  ClipboardList,
  Brain,
  Cloud,
  Eye,
  ShieldCheck,
  Scale,
  Sparkles,
  Building2,
  Briefcase,
  GraduationCap,
  Rocket,
  ClipboardCheck,
  ChevronDown,
  Lock,
  CheckCircle2,
} from 'lucide-react';
---
```

> Note: We removed the local `const BLUEPRINT_URL = '#get-on-the-list'` and `const CTA_LABEL = ...` — they now come from `src/lib/cta.ts`. The value of `BLUEPRINT_URL` also changes from `'#get-on-the-list'` to `'/#get-on-the-list'` (now absolute). Browser smooth-scroll still handles the in-page navigation correctly because the existing script intercepts clicks on `a[href^="#"]` — but `/#get-on-the-list` does NOT match `^#`. The handler will fall through to native browser navigation, which still scrolls to the anchor on the current page. This is the desired behavior; do not modify the smooth-scroll handler to match the new pattern.

- [ ] **Step 2: Replace the inline `<header>` with `<SiteNav />`**

Find the `<header id="site-nav">` block (currently lines 39–69 in the original file — after Step 1 your line numbers will have shifted slightly). Replace the entire `<header>…</header>` block with a single line:

```astro
  <SiteNav />
```

- [ ] **Step 3: Replace the inline footer with `<SiteFooter />`**

Find the `<footer class="border-t border-white/10 py-14 px-6">` block (originally lines 781–830). Replace the entire `<footer>…</footer>` block with:

```astro
    <SiteFooter />
```

- [ ] **Step 4: Replace the inline sticky CTA with `<StickyCta />`**

Find the `<div id="sticky-cta">` block (originally lines 833–845). Replace the entire block with:

```astro
  <StickyCta />
```

- [ ] **Step 5: Trim the inline `<script>` block**

Find the `<script>` block (originally starts around line 847). Replace the entire `<script>…</script>` block with the trimmed version below. This removes the scroll-state code (now lives in `SiteNav` and `StickyCta`) and keeps smooth-scroll + form submit.

```astro
  <script>
    // Smooth scroll for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Form submission → /api/subscribe
    const form = document.getElementById('cta-form');
    const thanks = document.getElementById('cta-thanks');
    const errorEl = document.getElementById('cta-error');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalLabel = btn ? btn.innerHTML : '';

        const first_name = form.querySelector('input[name="first_name"]').value.trim();
        const last_name = form.querySelector('input[name="last_name"]').value.trim();
        const email = form.querySelector('input[name="email"]').value.trim();
        const source = form.querySelector('input[name="source"]').value;
        const interests = Array.from(
          form.querySelectorAll('input[name="interests"]:checked'),
        ).map((cb) => cb.value);

        if (errorEl) errorEl.classList.add('hidden');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = 'Adding you to the list…';
        }

        try {
          const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, first_name, last_name, source, interests }),
          });
          if (!res.ok) throw new Error('Request failed');
          form.classList.add('hidden');
          if (thanks) thanks.classList.remove('hidden');
        } catch (err) {
          if (errorEl) errorEl.classList.remove('hidden');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalLabel;
          }
        }
      });
    }
  </script>
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors. If you get "duplicate id" warnings or missing-import errors, re-check Steps 1–5.

- [ ] **Step 7: Visual smoke-test homepage**

Run: `npm run dev`
Open `http://localhost:4321/` in a browser. Verify, by scrolling top-to-bottom:

1. Nav appears at the top; its background intensifies after scrolling past ~40px.
2. Hero renders as before with the gradient headline.
3. All section anchors (`#pricing`, `#founder`, `#get-on-the-list`) still work when clicked from the nav or footer.
4. Footer renders at the bottom with all four columns and social icons.
5. **On mobile viewport** (DevTools → narrow to ~390px wide): the sticky bottom CTA bar slides up after scrolling past the hero (~600px).
6. Submit the form with a junk email — confirm it transitions to the thanks state (the request will hit `/api/subscribe` and may 404 locally, which is fine; check for the loading-button text change first, and if you have the function deployed locally, the thanks state).

Stop the dev server.

- [ ] **Step 8: Commit Phase 1**

```bash
git add src/pages/index.astro
git commit -m "Refactor homepage to use shared chrome components"
```

---

# Phase 2 — Build `/sites`

Phase 2 introduces the new page. The homepage receives one small additional change (source-tagging).

---

### Task 6: Add `canonical` and `ogUrl` props to `Layout.astro`

The layout currently hardcodes `<link rel="canonical" href="https://getvibecontrol.com/" />` and `<meta property="og:url" content="https://getvibecontrol.com/" />`. Parameterize both so `/sites` can declare its own canonical URL. Defaults preserve current homepage behavior.

**Files:**
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Replace `src/layouts/Layout.astro` entirely**

```astro
---
interface Props {
  title?: string;
  description?: string;
  canonical?: string;
  ogUrl?: string;
}
const {
  title = 'VibeControl — Your AI workforce, running your business',
  description = 'Hire an AI office manager, sales assistant, or customer support rep for your small business. Starts with a $47 Blueprint that maps your AI workforce and builds your team.',
  canonical = 'https://getvibecontrol.com/',
  ogUrl = canonical,
} = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={ogUrl} />
    <meta property="og:image" content="https://getvibecontrol.com/images/logo-light.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <link rel="icon" type="image/png" href="/images/favicon.png" />
    <link rel="canonical" href={canonical} />
    <title>{title}</title>
  </head>
  <body class="bg-gray-950 text-white antialiased selection:bg-brand-teal/30 selection:text-white">
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. Homepage HTML output still contains `<link rel="canonical" href="https://getvibecontrol.com/">` (defaults preserve current behavior).

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "Parameterize Layout canonical and ogUrl"
```

---

### Task 7: Add source-override snippet to homepage form

When `/#get-on-the-list?source=sites` is loaded, the homepage form should override its hidden `source` input value from the URL before any submission.

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add the source-override snippet**

In `src/pages/index.astro`, locate the `<script>` block (now trimmed from Task 5). Inside that block, immediately before the line `// Form submission → /api/subscribe`, insert:

```astro
    // Override hidden source input from ?source= URL param if present
    const sourceParam = new URLSearchParams(window.location.search).get('source');
    if (sourceParam) {
      const sourceInput = document.querySelector('#cta-form input[name="source"]');
      if (sourceInput) sourceInput.value = sourceParam;
    }

```

The block should now read (in order): smooth-scroll, source-override, form submit.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Manually verify the override**

Run: `npm run dev`
Open `http://localhost:4321/?source=sites#get-on-the-list`
In DevTools console, run: `document.querySelector('#cta-form input[name="source"]').value`
Expected: `"sites"`

Then load `http://localhost:4321/` (no param) and run the same query.
Expected: `"vibecontrol-landing"`

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Override form source input from URL param on homepage"
```

---

### Task 8: Create `src/pages/sites.astro`

Build the full `/sites` page with all 7 sections per the source spec. Use shared components and copy from `docs/getvibecontrol-sites-v1.md` verbatim where the spec provides body text.

**Files:**
- Create: `src/pages/sites.astro`

- [ ] **Step 1: Create `src/pages/sites.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';
import StickyCta from '../components/StickyCta.astro';
import { blueprintUrlForSource, CTA_LABEL } from '../lib/cta';
import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react';

const CTA_HREF = blueprintUrlForSource('sites');

const showroom = [
  {
    eyebrow: 'Agency landing page',
    title: 'A landing page for an agency offering AI consulting',
    placeholderLabel: 'Screenshot placeholder — agency landing page',
    annotation:
      'Built in 90 minutes from a brief conversation. Updated 14 times since launch, all by conversation.',
  },
  {
    eyebrow: 'Course portal',
    title: 'A members-only course portal for an online educator',
    placeholderLabel: 'Screenshot placeholder — course portal',
    annotation:
      'Designed and built around the educator’s specific course catalog. New courses added by conversation, not by re-templating.',
  },
  {
    eyebrow: 'Event RSVP page',
    title: 'An event RSVP and weekly update page for a small organization',
    placeholderLabel: 'Screenshot placeholder — event RSVP page',
    annotation:
      'Set up in an afternoon. The AI worker rebuilds the page each week with the new event details.',
  },
];

const steps = [
  {
    n: 1,
    color: 'brand-blue',
    title: 'Tell your AI worker what you need.',
    body:
      'A landing page for a campaign. A signup form for a workshop. A member portal for your course. A storefront for a digital product. Describe it in plain English. The way you’d describe it to a freelancer — except shorter, because the AI doesn’t need a project brief, it needs a goal.',
  },
  {
    n: 2,
    color: 'brand-teal',
    title: 'It builds the surface and shows you.',
    body:
      'Not a wireframe. Not a mockup. The actual working surface — copy, layout, design, forms wired up, integrations connected to the rest of your business. Built around the context your AI workforce already has about your business (because your Roleforge Blueprint defined that context once, and every worker reads from it).',
  },
  {
    n: 3,
    color: 'brand-orange',
    title: 'You review, refine, and ship.',
    body:
      'Like or don’t like the headline? Say so. The page updates. Want a different layout? Ask. Want to A/B test two versions? It sets that up too. When you’re ready, you ship. The page is yours, on your domain, hosted on VibeControl infrastructure.',
  },
];

const faqs = [
  {
    q: 'Is this a website builder?',
    a:
      'Not in the way you mean. A website builder is a tool you use. VibeControl Sites is something your AI workforce uses. You don’t learn the tool — your AI worker already knows it. You describe what you want; the worker builds it.',
  },
  {
    q: 'Where do the sites actually live?',
    a:
      'On VibeControl’s infrastructure, served from sites.vibecontrol.app or your own custom domain (your call). Fast, secure, no servers for you to manage.',
  },
  {
    q: 'Can I bring my own domain?',
    a:
      'Yes. Point your domain at VibeControl and your sites serve from there. SSL handled automatically.',
  },
  {
    q: 'Can I edit the HTML / CSS directly?',
    a:
      'You can, if you want to — but most owners don’t. Editing by conversation is faster than editing by code for the kind of changes most businesses actually make.',
  },
  {
    q: 'What about SEO?',
    a:
      'Standard SEO fundamentals — clean HTML, semantic structure, fast load times, proper meta tags — are how the AI worker builds by default. For more advanced SEO work, your AI worker handles the changes you describe.',
  },
  {
    q: 'Is this just for landing pages, or full websites?',
    a:
      'Both. Landing pages, marketing sites, member portals, course platforms, simple storefronts, lead forms, event pages. If it’s a customer-facing surface that lives on the web, your AI workforce can build it.',
  },
  {
    q: 'What if my business needs something genuinely custom?',
    a:
      'The Virtual CTO offering (through Build3r) handles custom implementations for businesses that need them. Most businesses don’t. For the small percentage that do, that path exists.',
  },
];
---
<Layout
  title="AI builds your website — VibeControl Sites"
  description="Your AI workforce builds and runs your customer-facing surfaces. Landing pages, member portals, forms, storefronts. Part of VibeControl. Start with a $47 Blueprint."
  canonical="https://getvibecontrol.com/sites"
>
  <SiteNav />

  <main id="top" class="pt-16">
    <!-- SECTION 1 — HERO -->
    <section class="relative overflow-hidden">
      <div class="absolute top-10 left-1/4 w-[28rem] h-[28rem] bg-brand-blue/20 rounded-full blur-[140px]" aria-hidden="true"></div>
      <div class="absolute bottom-0 right-1/4 w-[26rem] h-[26rem] bg-brand-teal/20 rounded-full blur-[140px]" aria-hidden="true"></div>

      <div class="relative max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-28 text-center">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm text-gray-300 mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-teal"></span>
          <span class="text-brand-teal font-semibold">Sites</span>
          <span class="text-gray-600">·</span>
          A capability of your AI workforce
        </div>

        <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.05]">
          Your website. Your landing pages. Your forms.
          <span class="block bg-gradient-to-r from-brand-blue via-brand-teal to-brand-orange bg-clip-text text-transparent">
            Built by your AI workforce.
          </span>
        </h1>

        <p class="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          VibeControl includes an AI worker that builds your customer-facing
          surfaces — and rebuilds them whenever your business changes. No
          designer queue. No “let me brief my agency.” You ask, it ships.
        </p>

        <div class="flex flex-col items-center gap-3">
          <a
            href={CTA_HREF}
            class="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-brand-blue to-brand-teal font-semibold text-white hover:opacity-90 transition shadow-xl shadow-brand-blue/30"
          >
            {CTA_LABEL}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition" />
          </a>
          <p class="text-sm text-gray-400 max-w-md">
            The Blueprint maps the AI workforce your business needs — including
            the workers that build and run your sites.
          </p>
        </div>
      </div>
    </section>

    <!-- SECTION 2 — THE SHIFT -->
    <section class="relative py-24 sm:py-28 px-6">
      <div class="max-w-3xl mx-auto">
        <p class="text-sm font-semibold text-brand-teal uppercase tracking-wider mb-3">The shift</p>
        <h2 class="text-3xl md:text-5xl font-bold mb-8 leading-tight">
          A website used to be a project. Now it’s a conversation.
        </h2>
        <div class="space-y-5 text-gray-300 text-lg leading-relaxed">
          <p>You know how this normally goes.</p>
          <p>
            You need a new landing page for a campaign. You write a brief. You
            wait for the designer. They send a draft. You revise it. They
            revise it back. Two weeks later, the page goes live — and by then
            the campaign is half over.
          </p>
          <p>
            Or you do it yourself in Webflow / Framer / your CMS of choice. You
            spend a Saturday wrestling with templates, fonts, breakpoints. The
            page ships. You hate the headline by Tuesday. You don’t change it
            because changing it would take another Saturday.
          </p>
          <p>That’s how the web has worked for fifteen years. Every page is a project.</p>
          <p class="text-white font-medium">It doesn’t have to be.</p>
          <p>
            When your business runs on VibeControl, your AI workforce includes
            a worker whose job is your customer-facing surfaces. Tell it what
            you need. It builds the page. You review it, suggest changes, and
            ship. Want a different headline next week? Tell it. The page is
            updated by the time you finish your coffee.
          </p>
          <p class="text-gray-400 italic">The work isn’t gone. It’s just no longer your work.</p>
        </div>
      </div>
    </section>

    <!-- SECTION 3 — WHAT GETS BUILT (showroom) -->
    <section class="relative py-24 sm:py-28 px-6 overflow-hidden">
      <div class="absolute top-1/2 -translate-y-1/2 -left-40 w-96 h-96 bg-brand-blue/10 rounded-full blur-[120px]" aria-hidden="true"></div>

      <div class="relative max-w-5xl mx-auto">
        <div class="max-w-3xl mb-14">
          <p class="text-sm font-semibold text-brand-teal uppercase tracking-wider mb-3">What gets built</p>
          <h2 class="text-3xl md:text-5xl font-bold leading-tight">
            Real surfaces, built by AI workers, running in real businesses.
          </h2>
        </div>

        <div class="space-y-12">
          {showroom.map((item) => (
            <article class="rounded-3xl bg-white/[0.03] border border-white/10 p-6 md:p-8 backdrop-blur-md">
              <p class="text-xs font-semibold text-brand-teal uppercase tracking-wider mb-3">{item.eyebrow}</p>
              <h3 class="text-xl md:text-2xl font-semibold text-white mb-6 leading-snug">{item.title}</h3>

              <div class="relative aspect-[16/10] rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 overflow-hidden">
                <div class="absolute inset-0 bg-[linear-gradient(rgba(74,144,217,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(74,144,217,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                    <span class="w-1.5 h-1.5 rounded-full bg-brand-teal"></span>
                    {item.placeholderLabel}
                  </div>
                </div>
              </div>

              <p class="text-sm text-gray-400 italic mt-5 leading-relaxed">{item.annotation}</p>
            </article>
          ))}
        </div>

        <p class="text-gray-300 text-lg leading-relaxed mt-14 max-w-3xl">
          These aren’t mockups. They’re running surfaces, on real domains, used
          by real customers.
          <span class="text-white font-semibold">Nobody hired a designer to build them.</span>
        </p>
      </div>
    </section>

    <!-- SECTION 4 — HOW IT ACTUALLY WORKS -->
    <section class="relative py-24 sm:py-28 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="max-w-3xl mb-14">
          <p class="text-sm font-semibold text-brand-teal uppercase tracking-wider mb-3">How it works</p>
          <h2 class="text-3xl md:text-5xl font-bold leading-tight">
            Three steps. No code, no templates, no designer queue.
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-5 mb-10">
          {steps.map((step) => (
            <div class="p-7 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div class={`w-10 h-10 rounded-xl bg-${step.color}/20 flex items-center justify-center text-${step.color} font-bold mb-4`}>
                {step.n}
              </div>
              <h3 class="text-lg font-semibold text-white mb-3 leading-snug">{step.title}</h3>
              <p class="text-gray-400 leading-relaxed text-sm">{step.body}</p>
            </div>
          ))}
        </div>

        <p class="text-gray-500 leading-relaxed max-w-3xl">
          What you don’t do: pick a template, choose fonts, hire a designer,
          write a brief, file a ticket, wait for revisions, fight with
          breakpoints, hire someone to fight with breakpoints for you.
        </p>
      </div>
    </section>

    <!-- SECTION 5 — WHY THIS MATTERS -->
    <section class="relative py-24 sm:py-28 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="rounded-3xl bg-gradient-to-br from-brand-blue/10 via-white/[0.03] to-brand-teal/10 border border-white/10 p-8 md:p-12 backdrop-blur-md">
          <p class="text-sm font-semibold text-brand-teal uppercase tracking-wider mb-3">Why this matters</p>
          <h2 class="text-3xl md:text-4xl font-bold mb-8 leading-tight">
            This isn’t about cheaper websites. It’s about how the business runs.
          </h2>
          <div class="space-y-5 text-gray-300 leading-relaxed">
            <p>
              Most AI tools you’ve seen pitched at small businesses are point
              solutions. An AI to write your blog post. An AI to draft your
              emails. An AI to summarize your meetings. They help around the
              edges and leave the structure of the business untouched.
            </p>
            <p>
              VibeControl is different because it doesn’t add an AI tool to
              your stack — it gives your business an AI workforce that
              <em class="text-white not-italic font-semibold">does the work the stack used to require</em>.
            </p>
            <p class="text-white font-medium">
              Your business needs a website? You don’t buy Webflow and hire a designer. You ask your AI workforce.
            </p>
            <p class="text-white font-medium">
              Your business needs to follow up with leads? You don’t buy a CRM and hire a sales VA. You ask your AI workforce.
            </p>
            <p class="text-white font-medium">
              Your business needs to answer customer questions? You don’t buy a support tool and hire a support rep. You ask your AI workforce.
            </p>
            <p>
              The work still happens. It just doesn’t require a stack of
              separate tools and the time to coordinate between them. That’s
              the shift.
            </p>
          </div>

          <div class="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href={CTA_HREF}
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-teal font-semibold text-white hover:opacity-90 transition shadow-lg shadow-brand-blue/25"
            >
              {CTA_LABEL}
              <ArrowRight className="w-4 h-4" />
            </a>
            <p class="text-sm text-gray-500">
              The Blueprint identifies which workers your business should hire first — and shows you what they’ll build for you.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 6 — FAQ -->
    <section class="relative py-24 sm:py-28 px-6">
      <div class="max-w-3xl mx-auto">
        <div class="mb-14">
          <p class="text-sm font-semibold text-brand-teal uppercase tracking-wider mb-3">Common questions about Sites</p>
          <h2 class="text-3xl md:text-5xl font-bold leading-tight">
            A short FAQ — the rest is on the main pricing and FAQ pages.
          </h2>
        </div>

        <div class="space-y-3">
          {faqs.map((item) => (
            <details class="group rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition overflow-hidden">
              <summary class="flex items-center justify-between gap-6 px-6 py-5 cursor-pointer list-none">
                <h3 class="font-semibold text-white text-base md:text-[17px] leading-snug">{item.q}</h3>
                <div class="w-8 h-8 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-open:bg-brand-teal/20 group-open:border-brand-teal/40 transition">
                  <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 group-open:text-brand-teal transition" />
                </div>
              </summary>
              <div class="px-6 pb-6 -mt-1">
                <p class="text-gray-400 leading-relaxed">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>

    <!-- SECTION 7 — FINAL CTA -->
    <section class="relative py-24 sm:py-28 px-6">
      <div class="max-w-3xl mx-auto">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal/10 via-white/[0.03] to-brand-blue/10 border border-brand-teal/20 p-8 md:p-12 backdrop-blur-md">
          <div class="absolute -top-20 -right-20 w-72 h-72 bg-brand-teal/10 rounded-full blur-[100px]" aria-hidden="true"></div>
          <div class="relative">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
              14-Day Value Promise
            </div>
            <h2 class="text-3xl md:text-4xl font-bold mb-5 leading-tight">
              Find out which workers your business should hire first.
            </h2>
            <p class="text-gray-300 leading-relaxed mb-8">
              Sites is one of several capabilities your AI workforce can run
              for you. The $47 Roleforge Blueprint maps the workers your
              specific business needs — including which surfaces are worth
              building first, and what your AI team should run next.
            </p>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href={CTA_HREF}
                class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-teal font-semibold text-white hover:opacity-90 transition shadow-lg shadow-brand-blue/25"
              >
                {CTA_LABEL}
                <ArrowRight className="w-4 h-4" />
              </a>
              <p class="text-sm text-gray-500">
                $47 one-time. 14-day Value Promise: if it doesn’t deliver, we’ll work with you to make it right.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <SiteFooter />
  </main>

  <StickyCta href={CTA_HREF} />
</Layout>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds, output directory contains `dist/sites/index.html`.

- [ ] **Step 3: Visual smoke-test `/sites`**

Run: `npm run dev`
Open `http://localhost:4321/sites` in a browser. Verify:

1. All 7 sections render in order: Hero → The Shift → What gets built → How it works → Why this matters → FAQ → Final CTA.
2. Nav appears at the top with the same scroll-state behavior as the homepage.
3. Footer appears at the bottom, identical to the homepage footer.
4. Showroom placeholders render as three rounded boxes with the grid-pattern background and pill labels.
5. FAQ accordion expands on click; chevron rotates.
6. **Mobile viewport** (~390px wide): sticky CTA bar appears past hero.

- [ ] **Step 4: Verify CTA routing and source-tagging**

Still on `http://localhost:4321/sites`:

1. Inspect any CTA button's `href` attribute. Expected: `/#get-on-the-list?source=sites`
2. Click a CTA. Expected: navigates to `/#get-on-the-list?source=sites` and scrolls to the form.
3. In DevTools console on the resulting page: `document.querySelector('#cta-form input[name="source"]').value`
   Expected: `"sites"`
4. Submit the form (the request may 404 locally if `/api/subscribe` isn't wired — that's fine). Open DevTools Network tab and inspect the request payload. Expected: JSON body contains `"source":"sites"`.

- [ ] **Step 5: Verify canonical tag**

Still in the browser at `http://localhost:4321/sites`, view page source (Cmd+U / View > Page Source). Search for `canonical`.
Expected: `<link rel="canonical" href="https://getvibecontrol.com/sites">`

Then load `http://localhost:4321/` and view source.
Expected: `<link rel="canonical" href="https://getvibecontrol.com/">` (unchanged from before).

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/pages/sites.astro
git commit -m "Add /sites capability showroom page"
```

---

### Task 9: Final cross-page smoke test

A last walkthrough to catch anything missed.

- [ ] **Step 1: Build and serve a production preview**

Run: `npm run build && npm run preview`
Open the preview URL.

- [ ] **Step 2: Walk both pages**

1. Load `/`. Scroll top to bottom. Visually compare against your memory of the pre-refactor homepage — nothing should look different.
2. Click the nav Pricing/About links — should still scroll within the homepage.
3. Load `/sites`. Scroll top to bottom. Verify all sections render.
4. From `/sites`, click any CTA. Confirm landing on `/#get-on-the-list?source=sites` with the form scrolled into view and the hidden source input set to `sites`.
5. Switch to a narrow mobile viewport on both pages — confirm sticky bottom CTA appears past hero on each.

Stop the preview server.

- [ ] **Step 3: No commit needed (verification only)**

If anything failed, re-open the relevant task and fix. Otherwise, the plan is complete.

---

## Out of scope (do not implement)

- Real customer screenshots for the showroom (placeholders ship; real images drop in later by replacing the placeholder `<div>` block with an `<img loading="lazy">`).
- `siteai.chat → /sites` 301 redirect (DNS / Cloudflare work).
- `SoftwareApplication` schema markup.
- Hero / showroom A/B test variants.
- Any change to `/api/subscribe` backend (the existing function consumes the `source` field; nothing to update there).
- Pricing or FAQ changes on the homepage beyond the Phase 1 refactor.
