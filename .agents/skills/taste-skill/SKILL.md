---
name: taste-skill
description: Anti-slop frontend engineering skill for landing pages, portfolios, and redesigns. Enforces brief inference, dials (variance/motion/density), strict AI-tell bans (zero em-dashes, no fake previews), design system mapping, and pre-flight checklists.
---

# tasteskill: Anti-Slop Frontend Skill

Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI. Every rule below is contextual. None of it fires automatically. First read the brief, then pull only what fits.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, infer what the user actually wants. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
- **Page kind**: landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
- **Vibe words the user used**: "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
- **Reference signals**: URLs they linked, screenshots they pasted, products they named, brands they're competing with.
- **Audience**: B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.
- **Brand assets that already exist**: logo, color, type, photography. For redesigns, these are starting material, not optional input (see Section 11).
- **Quiet constraints**: accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.

### 0.B Output a one-line "Design Read" before generating
Before any code, state in one line:
> "Reading this as: `<page kind>` for `<audience>`, with a `<vibe>` language, leaning toward `<design system or aesthetic family>`."

**Example reads:**
- *"Reading this as: B2B SaaS landing for technical buyers, with a Linear-style minimalist language, leaning toward Tailwind utilities + Geist + restrained motion."*
- *"Reading this as: solo designer portfolio for hiring managers, with an editorial / kinetic-type language, leaning toward native CSS + scroll-driven animation + custom typography."*
- *"Reading this as: redesign of a public-sector service site, with a trust-first language, leaning toward GOV.UK Frontend or USWDS."*

### 0.C If the brief is ambiguous, ask one question, do not guess
Ask exactly one clarifying question — never a multi-question dump — and only when the design read genuinely diverges. Example: *"Should this feel closer to Linear-clean or Awwwards-experimental?"*
If you can confidently infer from context, do not ask. Just declare the design read and proceed.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.

---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials. Every layout, motion, and density decision below is gated by these.

- `DESIGN_VARIANCE`: **8** — 1 = Perfect Symmetry, 10 = Artsy Chaos
- `MOTION_INTENSITY`: **6** — 1 = Static, 10 = Cinematic / Physics
- `VISUAL_DENSITY`: **4** — 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

**Baseline**: 8 / 6 / 4. Use these unless the design read overrides them. Do not ask the user to edit this file — overrides happen conversationally.

### 1.A Dial Inference (design read → dial values)

| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |
| "redesign - preserve" | match existing | +1 | match existing |
| "redesign - overhaul" | +2 | +2 | match existing |

### 1.B Use-Case Presets

| Use case | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Landing (SaaS, mainstream) | 7 | 6 | 4 |
| Landing (Agency / creative) | 9 | 8 | 3 |
| Landing (Premium consumer) | 7 | 6 | 3 |
| Portfolio (Designer / studio) | 8 | 7 | 3 |
| Portfolio (Developer) | 6 | 5 | 4 |
| Editorial / Blog | 6 | 4 | 3 |
| Public-sector service | 3 | 2 | 5 |
| Redesign - preserve | match | match+1 | match |
| Redesign - overhaul | +2 | +2 | match |

### 1.C How the Dials Drive Output
Use these (or user-overridden values) as global variables. Cross-references throughout this document refer to these exact variable names — never invent aliases like `LAYOUT_VARIANCE` or `ANIM_LEVEL`.

---

## 2. BRIEF → DESIGN SYSTEM MAP

Once you have the design read (Section 0) and dials (Section 1), pick the right foundation. Do not invent CSS for things that have an official package. Do not pretend an aesthetic trend is an official system.

### 2.A When to reach for a real design system (use official packages)

| Brief reads as… | Reach for | Why |
|---|---|---|
| Microsoft / enterprise SaaS / dashboards | `@fluentui/react-components` or `@fluentui/web-components` | Official Fluent UI, Microsoft tokens, accessibility done |
| Google-ish UI, Material-flavored product | `@material/web` + Material 3 tokens | Official, theme-able via Material Theming |
| IBM-style B2B / enterprise analytics | `@carbon/react` + `@carbon/styles` | Official Carbon, mature data-density patterns |
| Shopify app surfaces | polaris.js web components / Polaris React | Required for Shopify admin UI |
| Atlassian / Jira-style product | `@atlaskit/*` + `@atlaskit/tokens` | Official Atlassian DS |
| GitHub-style devtool / community page | `@primer/css` or `@primer/react-brand` | Official Primer; Brand variant for marketing |
| Public-sector UK service | `govuk-frontend` | Legally / regulatorily expected |
| US public-sector / trust-first | `uswds` | Same |
| Fast local-business / agency MVP | `Bootstrap 5.3` | Boring, fast, works |
| Modern accessible React foundation | `@radix-ui/themes` | Primitives + polished theme |
| Modern SaaS where you own the components | `shadcn/ui` (`npx shadcn@latest add ...`) | You own the code, easy to customise; never ship default state |
| Tailwind-based modern SaaS / AI marketing | Tailwind v4 utilities + `dark:` variant | Default for indie + small team builds |

**Honesty rule**: if the brief reads as one of the systems above, install and use the official package. Do not recreate its CSS by hand. Do not import a system's tokens but then override 90% of them.
**One system per project**: Do not mix Fluent React with Carbon in the same tree. Do not import shadcn/ui components into a Material 3 app.

### 2.B When the brief is an aesthetic, not a system
For these directions, there is no single official package. Build with native CSS + Tailwind + a maintained component library. Be honest in code comments about what is borrowed inspiration vs. official material.

| Aesthetic | Honest implementation |
|---|---|
| Glassmorphism / "frosted glass" | `backdrop-filter`, layered borders, highlight overlays. Provide solid-fill fallback for `prefers-reduced-transparency`. |
| Bento (Apple-style tile grids) | CSS Grid with mixed cell sizes. No single library owns this. |
| Brutalism | Native CSS, monospace, raw borders. No library. |
| Editorial / magazine | Serif type, asymmetric grid, generous whitespace. No library. |
| Dark tech / hacker | Mono + accent neon, terminal motifs. No library. |
| Aurora / mesh gradients | SVG or layered radial gradients. No library. |
| Kinetic typography | Native CSS animations, scroll-driven animations, GSAP for hijacks. No library. |
| Apple Liquid Glass | Apple documents this for Apple platforms only. There is no official liquid-glass.css. Web implementations are approximations using backdrop-filter + layered borders + highlights. Label clearly as approximation. |

---

## 3. DEFAULT ARCHITECTURE & CONVENTIONS

Unless the design read picks a real design system (Section 2.A), these are the defaults:

### 3.A Stack
- **Framework**: React or Next.js. Default to Server Components (RSC).
  - *RSC SAFETY*: Global state works ONLY in Client Components. In Next.js, wrap providers in a `"use client"` component.
  - *INTERACTIVITY ISOLATION*: Any component using Motion, scroll listeners, or pointer physics MUST be an isolated leaf with `'use client'` at the top. Server Components render static layouts only.
- **Styling**: Tailwind v4 (default). Tailwind v3 only if the existing project demands it. For v4: do NOT use `tailwindcss` plugin in `postcss.config.js`. Use `@tailwindcss/postcss` or the Vite plugin.
- **Animation**: Motion (formerly Framer Motion). Import from `motion/react` (`import { motion } from "motion/react"`). The `framer-motion` package still works as a legacy alias — prefer `motion/react` in new code.
- **Fonts**: Always use `next/font` (Next.js) or self-host with `@font-face` + `font-display: swap`. Never link Google Fonts via `<link>` in production.

### 3.B State
- Local `useState` / `useReducer` for isolated UI.
- Global state ONLY for deep prop-drilling avoidance — Zustand, Jotai, or React context.
- **NEVER use `useState` to track continuous values driven by user input** (mouse position, scroll progress, pointer physics, magnetic hover). Use Motion's `useMotionValue` / `useTransform` / `useScroll`. `useState` re-renders the React tree on every change and collapses on mobile.

### 3.C Icons
- **Allowed libraries (priority order)**: `@phosphor-icons/react`, `hugeicons-react`, `@radix-ui/react-icons`, `@tabler/icons-react`.
- **Discouraged**: `lucide-react`. Acceptable only when the user explicitly asks for it or the project already depends on it.
- **NEVER hand-roll SVG icons**. If a glyph is missing, install a second library or compose from primitives — do not draw icon paths from scratch.
- One family per project. Do not mix Phosphor with Lucide in the same component tree.
- Standardize `strokeWidth` globally (e.g. 1.5 or 2.0).

### 3.D Emoji Policy
Discouraged by default in code, markup, and visible text. Replace symbols with icon-library glyphs. Override: allow emojis only when the user explicitly asks for a playful / chat-style / social-native vibe — and even then use them sparingly with intent.

### 3.E Responsiveness & Layout Mechanics
- Standardize breakpoints (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`).
- Contain page layouts using `max-w-[1400px] mx-auto` or `max-w-7xl`.
- **Viewport Stability**: NEVER use `h-screen` for full-height Hero sections. ALWAYS use `min-h-[100dvh]` to prevent layout jumping on mobile (iOS Safari address bar).
- **Grid over Flex-Math**: NEVER use complex flexbox percentage math (`w-[calc(33%-1rem)]`). ALWAYS use CSS Grid (`grid grid-cols-1 md:grid-cols-3 gap-6`).

### 3.F Dependency Verification (mandatory)
Before importing ANY 3rd-party library, check `package.json`. If the package is missing, output the install command first. Never assume a library exists.

---

## 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

LLMs default to clichés. Override these defaults proactively. Each rule has a context-aware override path.

### 4.1 Typography
- **Display / Headlines**: Default `text-4xl md:text-6xl tracking-tighter leading-none`.
- **Body / Paragraphs**: Default `text-base text-gray-600 leading-relaxed max-w-[65ch]`.
- **Sans font choice**:
  - *Discouraged as default*: Inter. Pick Geist, Outfit, Cabinet Grotesk, Satoshi, or a brand-appropriate serif first.
  - *Override*: Inter is acceptable when the user explicitly asks for a neutral / standard / Linear-style feel, or when the brief is a public-sector / accessibility-first site.
  - *Pairings to know*: Geist + Geist Mono, Satoshi + JetBrains Mono, Cabinet Grotesk + Inter Tight, GT America + IBM Plex Mono.
- **SERIF DISCIPLINE (VERY DISCOURAGED AS DEFAULT)**:
  - Serif is very discouraged as the default font for any project. "It feels creative / premium / editorial" is NOT a reason to reach for serif. The agent's default mental model that "creative brief = serif" is the single most-tested AI tell in production rounds.
  - Serif is only acceptable when ONE of these is explicitly true:
    1. The brand brief literally names a serif font, OR
    2. The aesthetic family is genuinely editorial / luxury / publication / manuscript / heritage / vintage AND you can articulate why this specific serif fits this specific brand.
  - For everything else (creative agency, design studio, modern brand, premium consumer, portfolio, lifestyle), default sans-serif display (Geist Display, ABC Diatype, Söhne Breit, Cabinet Grotesk Display, Migra Sans, GT Walsheim, Inter Display, PP Neue Montreal).
  - **EMPHASIS RULE**: When you want to emphasize a word within a headline, use italic or bold of the SAME font. Do NOT inject a random serif word into a sans headline (or vice versa) just to add visual interest.
  - **Specifically BANNED as defaults**: `Fraunces` and `Instrument_Serif` (the two LLM-favorite display serifs).
  - If a serif is justified (rare, per the above), rotate from this pool (do NOT reuse the same serif across consecutive projects): PP Editorial New, GT Sectra Display, Cardinal Grotesque, Reckless Neue, Tiempos Headline, Recoleta, Cormorant Garamond, Playfair Display, EB Garamond, IvyPresto, Migra, Editorial Old, Saol Display, Söhne Breit Kursiv, Domaine Display, Canela, Schnyder, Tobias, NB Architekt, ITC Galliard.
- **ITALIC DESCENDER CLEARANCE (mandatory)**: When italic is used in display type and the word contains a descender letter (`y g j p q`), `leading-[1]` or `leading-none` will clip the descender. Use `leading-[1.1]` minimum and add `pb-1` or `mb-1` reserve on the wrapping element. Audit every italic word in display headlines before shipping.

### 4.2 Color Calibration
- Max 1 accent color. Saturation < 80% by default.
- **THE LILA RULE**: The "AI Purple / Blue glow" aesthetic is discouraged as a default. No automatic purple button glows, no random neon gradients. Use neutral bases (Zinc / Slate / Stone) with high-contrast singular accents (Emerald, Electric Blue, Deep Rose, Burnt Orange, etc.).
  - *Override*: if the brand or brief explicitly asks for purple / violet / lila, embrace it. But execute with intent: consistent palette, harmonised neutrals, restrained gradients.
- One palette per project. Do not fluctuate between warm and cool grays within the same project.
- **COLOR CONSISTENCY LOCK (mandatory)**: Once an accent color is chosen for a page, it is used on the WHOLE page. A warm-grey site does not suddenly get a blue CTA in section 7.
- **PREMIUM-CONSUMER PALETTE BAN (mandatory)**:
  - For premium-consumer briefs (cookware, wellness, artisan, luxury, heritage craft, DTC home goods, etc.) the LLM default is warm beige/cream + brass/clay/oxblood/ochre + espresso/ink dark text. Concretely banned hex families as default backgrounds and accents:
    - *Backgrounds*: `#f5f1ea`, `#f7f5f1`, `#fbf8f1`, `#efeae0`, `#ece6db`, `#faf7f1`, `#e8dfcb`
    - *Accents*: `#b08947`, `#b6553a`, `#9a2436`, `#9c6e2a`, `#bc7c3a`, `#7d5621`
    - *Text*: `#1a1714`, `#1a1814`, `#1b1814`
  - *Default alternatives (rotate, do not reuse)*:
    - Cold Luxury: silver-grey + chrome + smoke
    - Forest: deep green + bone + amber accent
    - Black and Tan: true off-black + warm tan, sharp contrast, no beige
    - Cobalt + Cream: saturated blue against a single neutral, no brass
    - Terracotta + Slate: warm rust against cool grey, no brass
    - Olive + Brick + Paper: muted olive plus brick-red accent
    - Pure monochrome + single saturated pop: off-white + off-black + one bright accent

### 4.3 Layout Diversification
- **ANTI-CENTER BIAS**: Centered Hero / H1 sections are avoided when `DESIGN_VARIANCE > 4`. Force "Split Screen" (50/50), "Left-aligned content / right-aligned asset", "Asymmetric white-space", or scroll-pinned structures.
- *Override*: centered hero is OK for editorial / manifesto / launch-announcement briefs where the message itself is the design.

### 4.4 Materiality, Shadows, Cards
- Use cards ONLY when elevation communicates real hierarchy. Otherwise group with `border-t`, `divide-y`, or negative space.
- When a shadow is used, tint it to the background hue. No pure-black drop shadows on light backgrounds.
- For `VISUAL_DENSITY > 7`: generic card containers are banned. Data metrics breathe in plain layout.
- **SHAPE CONSISTENCY LOCK (mandatory)**: Pick ONE corner-radius scale for the page and stick to it (all-sharp: radius 0, all-soft: radius 12-16px, all-pill: full radius for interactive). Mixed systems are allowed only when there is a documented rule.

### 4.5 Interactive UI States
- **Loading**: Skeletal loaders matching the final layout's shape. Avoid generic circular spinners.
- **Empty States**: Beautifully composed; indicate how to populate.
- **Error States**: Clear, inline (forms), or contextual (toasts only for transient).
- **Tactile Feedback**: On `:active`, use `-translate-y-[1px]` or `scale-[0.98]` to simulate a physical push.
- **BUTTON CONTRAST CHECK (mandatory, a11y)**: Audit every CTA: contrast ratio WCAG AA min (4.5:1 for body, 3:1 for large text 18px+). Ghost buttons over photographic backgrounds must use a backdrop, scrim, or stroke.
- **CTA BUTTON WRAP BAN (mandatory)**: Button text MUST fit on one line at desktop. 3 words max for primary CTAs, ideally 1-2.
- **NO DUPLICATE CTA INTENT (mandatory)**: Two CTAs with the same intent on one page is a Pre-Flight Fail (e.g., "Get in touch" + "Let's talk" = pick ONE label).
- **FORM CONTRAST CHECK (mandatory, a11y)**: Form inputs, placeholder text, focus rings, helper text, and error text must all pass WCAG AA contrast against the section background.

### 4.6 Data & Form Patterns
- Label ABOVE input. Helper text optional but present in markup. Error text BELOW input. Standard gap-2 for input blocks.
- No placeholder-as-label. Ever.

### 4.7 Layout Discipline (Hard Rules)
- **Hero MUST fit initial viewport**: Headline max 2 lines on desktop, subtext max 20 words AND max 3-4 lines, CTAs visible without scroll.
- **Hero font-scale discipline**: Default sensible range: `text-4xl md:text-5xl lg:text-6xl`; `text-6xl md:text-7xl` only when headline is 3-5 words.
- **HERO TOP PADDING CAP (mandatory)**: Max `pt-24` (≈6rem) at desktop.
- **HERO STACK DISCIPLINE (max 4 text elements)**: Eyebrow OR brand strip (0 or 1), Headline (max 2 lines), Subtext (max 20 words, max 4 lines), CTAs (1 primary + max 1 secondary). BANNED: tiny tagline below CTAs, trust micro-strip, pricing teaser, avatar row inside the hero stack.
- **"Used by" / "Trusted by" logo wall**: Belongs UNDER the hero, never inside it.
- **Navigation**: Single line on desktop. Height cap: 80px max desktop, default 64-72px.
- **BENTO CELL COUNT RULE (mandatory)**: Exactly as many cells as you have content for (3 items → 3 cells). No empty placeholder tiles.
- **Section-Layout-Repetition Ban**: Once you use a layout family for a section, that family can appear at most ONCE on the page. A page with 8 sections must use at least 4 different layout families.
- **ZIGZAG ALTERNATION CAP (mandatory)**: Max 2 consecutive sections with left/right alternating image+text split. The 3rd consecutive is a Pre-Flight Fail.
- **EYEBROW RESTRAINT (mandatory)**: Max 1 eyebrow per 3 sections. Hero counts as 1. If section A has an eyebrow, the next 2 sections cannot have one.
- **SPLIT-HEADER BAN (mandatory)**: "Left big headline + right small explainer paragraph" banned as default. Stack vertically instead.
- **Bento Background Diversity**: Multi-cell grids require real visual variation (image, gradient, pattern, tinted background) across at least 2-3 cells.
- **Mobile collapse**: Explicit per section (< 768px fallback declared directly).

### 4.8 Image & Visual Asset Strategy
- **Image-generation tool first**: If ANY image-gen tool is available (`generate_image`, etc.), use it to create section-specific assets.
- **Real web images second**: Use `https://picsum.photos/seed/{descriptive-seed}/{w}/{h}` or real stock/brand URLs.
- **Last resort**: Leave clearly labeled slots (`<!-- TODO: hero product photo, 1600x1200 -->`) and report missing placements to the user.
- **Even minimalist sites need real images**: Text-only pages with fake-screenshot divs are slop.
- **Real company logos**: Use Simple Icons (`https://cdn.simpleicons.org/{slug}/ffffff`) or Devicon. If the brand is invented, generate an inline SVG monogram mark.
- **LOGO-ONLY rule (mandatory)**: No category labels below logos (no "Vercel + hosting").
- **Div-based fake screenshots are banned**: Never simulate product UI out of `<div>` rectangles.

### 4.9 Content Density
- Short headline (≤ 8 words) + short sub-paragraph (≤ 25 words) + one visual asset OR CTA.
- No data-dump sections.
- Long lists (> 5 items): use 2-column split, card grid with image+label, tabs/accordion, horizontal scroll-snap pills, or carousel.
- **Spec sheets**: No long tables with hairlines under every row. Use 2-col card grids, scroll-snap pills, or grouped chunks.
- **COPY SELF-AUDIT (mandatory)**: Re-read every visible string before shipping. Flag and rewrite grammatically broken or AI-hallucinated phrases.
- **Fake-precise numbers**: AI-invented spec aesthetics (92%, 4.1×, 5.8mm) are banned unless grounded in real data or labeled mock.
- One copy register per page.

### 4.10 Quotes & Testimonials
- Max 3 lines of quote body.
- No em-dashes inside quote text.
- Attribution: name + role + (optionally) company. Never name only.
- Quote marks: real typographic quotes (`“ ”`) or none at all.

### 4.11 Page Theme Lock
- The page has ONE theme (light, dark, or auto). Sections do not flip from dark to light mode mid-scroll.

---

## 5. CONTEXT-AWARE PROACTIVITY

- **Liquid Glass / Glassmorphism**: For premium consumer, Apple-adjacent, luxury brand, or media-overlay vibes. Provide solid-fill fallback under `prefers-reduced-transparency`.
- **Magnetic Micro-physics**: Use when `MOTION_INTENSITY > 5`. Implement EXCLUSIVELY with Motion's `useMotionValue` / `useTransform`. Never `useState`.
- **Perpetual Micro-Interactions**: Use when `MOTION_INTENSITY > 5` and section actively benefits. Spring physics (`type: "spring", stiffness: 100, damping: 20`).
- **Motion claimed = motion shown**: If `MOTION_INTENSITY > 4`, the page must actually animate. If unable, drop to 3 and ship clean static CSS.
- **MOTION MUST BE MOTIVATED (mandatory)**: Every animation must communicate hierarchy, storytelling, feedback, or state transition.
- **MARQUEE MAX-ONE-PER-PAGE (mandatory)**: At most one horizontal marquee per page.
- **GSAP Skeletons**: Start at `start: "top top"`, `pin: true`. (See canonical code snippets below).

### 5.A Sticky-Stack - Canonical Skeleton
```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div
          key={i}
          className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center"
        >
          {card}
        </div>
      ))}
    </div>
  );
}
```

### 5.B Horizontal-Pan - Canonical Skeleton
```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}
```

### 5.C Scroll-Reveal Stagger - Canonical Skeleton (Lighter Alternative)
```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

### 5.D Forbidden Animation Patterns
- `window.addEventListener("scroll", ...)` is banned.
- Custom scroll progress in React state (`window.scrollY`) is banned.
- `requestAnimationFrame` loops touching React state are banned.

---

## 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

- **Hardware Acceleration**: Animate ONLY `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`.
- **Reduced Motion (mandatory)**: Any motion above `MOTION_INTENSITY > 3` MUST honor `prefers-reduced-motion`.
- **Dark Mode**: Dual-mode by default. Maintain WCAG AA contrast (AAA for body).
- **Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **DOM Cost**: Grain/noise filters EXCLUSIVELY on fixed, `pointer-events-none` pseudo-elements. NEVER on scrolling containers.
- **Z-Index Restraint**: No arbitrary `z-50` or `z-10` spam. Use systemic layer constants.

---

## 7. DIAL DEFINITIONS (Technical Reference)

- **`DESIGN_VARIANCE` (1-10)**:
  - 1-3: Symmetrical CSS Grid, equal paddings, centered alignment.
  - 4-7: Margins overlaps, varied aspect ratios (4:3 next to 16:9), left-aligned headers.
  - 8-10: Masonry, fractional grid units (`2fr 1fr 1fr`), large asymmetric empty zones.
  - *Mobile Override*: For 4-10, asymmetric layouts MUST collapse to single-column on viewports < 768px.
- **`MOTION_INTENSITY` (1-10)**:
  - 1-3: Static, CSS `:hover` / `:active` only.
  - 4-7: Fluid CSS transitions (`cubic-bezier(0.16, 1, 0.3, 1)`), animation cascades.
  - 8-10: Advanced choreography (Motion hooks, GSAP ScrollTrigger).
- **`VISUAL_DENSITY` (1-10)**:
  - 1-3: Art gallery whitespace (`py-32` to `py-48`).
  - 4-7: Standard web app spacing (`py-16` to `py-24`).
  - 8-10: Cockpit density. 1px line separators. `font-mono` for numbers.

---

## 8. DARK MODE PROTOCOL

- Dual-mode by default.
- Choose either Tailwind `dark:` variant or CSS variables.
- No pure `#000000` and no pure `#ffffff`. Use `zinc-950` and off-white.
- Respect `prefers-color-scheme`.

---

## 9. AI TELLS (Forbidden Patterns)

### 9.A Visual & CSS
- NO neon / outer glows by default.
- NO pure black (`#000000`).
- NO oversaturated accents.
- NO excessive gradient text for large headers.
- NO custom mouse cursors.

### 9.B Typography
- AVOID Inter as default.
- NO oversized H1s that just scream.
- Serif constraints: only when explicitly justified.

### 9.C Layout & Spacing
- NO 3-column equal feature cards.

### 9.D Content & Data ("Jane Doe" Effect)
- NO generic names ("John Doe", "Sarah Chan").
- NO generic avatars (SVG egg).
- NO fake-perfect numbers (99.99%, 50%).
- NO startup-slop brand names ("Acme", "Nexus", "SmartFlow").
- NO filler verbs ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize").

### 9.E External Resources & Components
- NO hand-rolled SVG icons.
- NO div-based fake screenshots.
- NO broken Unsplash links.
- `shadcn/ui`: Never in its unstyled default state.

### 9.F Production-Test Tells (banned outright)
- NO version labels in the hero (`V0.6`, `BETA`, `EARLY ACCESS`).
- NO section-number eyebrows (`00 / INDEX`, `001 · Capabilities`).
- Middle-dot (`·`) rationed to max 1 per line.
- NO decorative colored status dots on nav/badges/lists.
- NO `<br>`-broken and italicized headlines as default.
- NO vertical rotated text.
- NO hairline grid lines as decoration.
- NO fake product UI in hero built from divs.
- NO "Quietly in use at" / "Quietly trusted by".
- NO "From the field" / "Field notes" / "On our desks" poetic labels.
- NO weather / locale strips (`LIS 14:23 · 18°C`).
- NO generic step labels (`Stage 1: Install`).
- NO pills/labels overlaid on images.
- NO photo-credit captions as decoration (`Field study no. 12 · Ines Caetano`).
- NO decoration text strip at hero bottom (`BRAND. MOTION. SPATIAL.`).
- NO floating top-right sub-text in section headings.
- NO scroll cues (`Scroll`, `↓ scroll`).

### 9.G EM-DASH BAN (the single most-violated Tell)
**Em-dash (`—`) is COMPLETELY banned.** It is the LLM's signature stylistic crutch.
- Banned in headlines, eyebrows, pills, body copy, quotes, attribution, captions, buttons, and alt text.
- Replace with a period, comma, colon, parentheses, or a regular hyphen (`-`).
- Date and number ranges use regular hyphen (`2018-2026`).
- **If output contains a single `—` or `–`, the output fails the Pre-Flight Check.**

---

## 10. REFERENCE VOCABULARY

- **Hero Paradigms**: Asymmetric Split Hero, Editorial Manifesto Hero, Video/Media Mask Hero, Kinetic-Type Hero, Curtain-Reveal Hero, Scroll-Pinned Hero.
- **Navigation & Menus**: Mac OS Dock Magnification, Magnetic Button, Gooey Menu, Dynamic Island, Contextual Radial Menu, Mega Menu Reveal.
- **Layout & Grids**: Bento Grid, Masonry Layout, Chroma Grid, Split-Screen Scroll, Sticky-Stack Sections.
- **Cards & Containers**: Parallax Tilt Card, Spotlight Border Card, Glassmorphism Panel, Holographic Foil Card, Morphing Modal.
- **Scroll Animations**: Sticky Scroll Stack, Horizontal Scroll Hijack, Zoom Parallax, Scroll Progress Path.
- **Galleries & Media**: Accordion Image Slider, Hover Image Trail, Drag-to-Pan Grid.
- **Typography & Text**: Kinetic Marquee, Text Mask Reveal, Text Scramble Effect.
- **Animation Stack Isolation**: Never mix GSAP / Three.js with Motion in the same component tree.

---

## 11. REDESIGN PROTOCOL

1. **Detect Mode**: Greenfield, Redesign - Preserve, or Redesign - Overhaul.
2. **Audit Before Touching**: Brand tokens, IA, content blocks, patterns to preserve/retire, SEO baseline.
3. **Preservation Rules**: Do not change IA, extract brand colors, preserve copy voice, honor accessibility, respect analytics hooks.
4. **Modernisation Levers (in priority order)**:
   1. Typography refresh
   2. Spacing & rhythm
   3. Color recalibration
   4. Motion layer
   5. Hero & key-section recomposition
   6. Full block replacement
5. **Never Change Silently**: URL routes, nav labels, form field names, brand logo, legal copy.

---

## 12. THE BLOCK LIBRARY (Contract)

### 12.A File Location
`skills/taste-skill/blocks/<category>/<name>.md`

### 12.B Required Frontmatter
```yaml
---
name: asymmetric-split-hero
category: hero
dial_compatibility:
  variance: [6, 10]
  motion: [3, 10]
  density: [2, 5]
when_to_use: "Landing pages with one strong asset and one strong message."
not_for: "Editorial / manifesto launches."
stack: ["react", "next", "tailwind", "motion"]
---
```

---

## 13. OUT OF SCOPE

This skill is NOT for:
- Dashboards / dense product UI / admin panels
- Data tables
- Multi-step forms / wizards
- Code editors
- Native mobile apps
- Realtime collaborative canvas / presence UIs

---

## 14. FINAL PRE-FLIGHT CHECK

Run this matrix before outputting code. This is mandatory:
- [ ] Brief inference declared (Section 0.B one-liner)?
- [ ] Dial values explicit and reasoned from the brief?
- [ ] Design system chosen from Section 2 or aesthetic labeled honestly?
- [ ] Redesign mode detected and audit performed?
- [ ] **ZERO em-dashes (`—`) anywhere on the page** (Headlines, eyebrows, pills, body, quotes, attribution, captions, buttons, alt text)?
- [ ] Page Theme Lock: ONE theme for the whole page?
- [ ] Color Consistency Lock: one accent color used across all sections?
- [ ] Shape Consistency Lock: one corner-radius scale?
- [ ] Button Contrast Check: every CTA text readable (WCAG AA 4.5:1)?
- [ ] CTA Button Wrap: no CTA label wraps to 2+ lines at desktop?
- [ ] Form Contrast Check: WCAG AA compliant?
- [ ] Serif discipline: no Fraunces / Instrument_Serif defaults?
- [ ] Premium-consumer palette check: no AI-default beige+brass+oxblood+espresso?
- [ ] Italic descender clearance: `leading-[1.1]` min + `pb-1` reserve?
- [ ] Hero fits the viewport (headline ≤ 2 lines, subtext ≤ 20 words)?
- [ ] Hero top padding: max `pt-24` at desktop?
- [ ] Hero stack discipline: max 4 text elements?
- [ ] Eyebrow count: count ≤ `ceil(sectionCount / 3)`?
- [ ] Split-Header Ban: no split-header default?
- [ ] Zigzag Alternation Cap: max 2 consecutive split sections?
- [ ] No Duplicate CTA Intent?
- [ ] Logo wall: logo only, no category sub-labels?
- [ ] Bento background diversity: visual variation across 2-3 cells?
- [ ] "Used by" logo wall lives UNDER the hero, uses real SVG logos?
- [ ] Copy Self-Audit completed?
- [ ] Motion motivated: every animation has a clear communicative role?
- [ ] Marquee: max one per page?
- [ ] Navigation on ONE line at desktop, height ≤ 80px?
- [ ] Section layout repetition check passed?
- [ ] Bento has rhythm AND exact cell count?
- [ ] Long lists (> 5 items) use appropriate alternative component?
- [ ] Real images used (gen-tool, Picsum seed, explicit placeholders)?
- [ ] No pills/labels overlaid on images?
- [ ] No photo-credit captions as decoration?
- [ ] No version footers on marketing pages?
- [ ] No micro-meta-sentences under eyebrows?
- [ ] No decoration text strip at hero bottom?
- [ ] No scroll cues?
- [ ] No version labels in hero?
- [ ] No section-numbering eyebrows?
- [ ] No decorative dots?
- [ ] Quotes ≤ 3 lines of body?
- [ ] Motion claimed = motion shown?
- [ ] GSAP skeletons start at `top top` with `pin: true`?
- [ ] No `window.addEventListener('scroll')`?
- [ ] Reduced motion wrapped for motion > 3?
- [ ] Dark mode tokens defined and tested in both modes?
- [ ] Viewport stability: `min-h-[100dvh]`, never `h-screen`?
- [ ] Icons from allowed library only (Phosphor, HugeIcons, Radix, Tabler)?
- [ ] One design system per project?

---

## APPENDICES - Real Source-Backed Reference Material

### Appendix A - Install Commands per Design System
```bash
# Material Web (Material 3)
npm install @material/web

# Fluent UI React (v9)
npm install @fluentui/react-components

# Fluent UI Web Components (framework-free)
npm install @fluentui/web-components @fluentui/tokens

# IBM Carbon
npm install @carbon/react @carbon/styles

# Radix Themes
npm install @radix-ui/themes

# shadcn/ui (open code, owned components)
npx shadcn@latest init
npx shadcn@latest add button card badge separator input

# Primer CSS (GitHub product/devtool UI)
npm install --save @primer/css

# Primer Brand (GitHub marketing UI)
npm install @primer/react-brand

# GOV.UK Frontend
npm install govuk-frontend

# USWDS (US Web Design System)
npm install uswds

# Atlassian Design System (Atlaskit)
yarn add @atlaskit/css-reset @atlaskit/tokens @atlaskit/button @atlaskit/badge @atlaskit/section-message @atlaskit/card

# Bootstrap 5.3
npm install bootstrap
```

### Appendix B - Canonical Sources
- Material Web: https://github.com/material-components/material-web
- Fluent UI: https://fluent2.microsoft.design/get-started/develop
- Carbon: https://carbondesignsystem.com/
- Shopify Polaris: https://shopify.dev/docs/api/app-home/web-components
- Atlassian: https://atlassian.design/get-started/develop
- Primer: https://primer.style/
- GOV.UK: https://design-system.service.gov.uk/
- USWDS: https://designsystem.digital.gov/
- Bootstrap: https://getbootstrap.com/docs/5.3/layout/grid/
- Tailwind: https://tailwindcss.com/docs/dark-mode
- Radix Themes: https://www.radix-ui.com/themes/docs/overview/getting-started
- shadcn/ui: https://ui.shadcn.com/docs

### Appendix C - Apple Liquid Glass: Honest Web Approximation
```css
.liquid-glass-web-approx {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / .32);
  background: linear-gradient(135deg, rgb(255 255 255 / .30), rgb(255 255 255 / .08)), rgb(255 255 255 / .12);
  backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .48), inset 0 -1px 0 rgb(255 255 255 / .12), 0 18px 60px rgb(0 0 0 / .18);
}

.liquid-glass-web-approx::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: radial-gradient(circle at 20% 0%, rgb(255 255 255 / .55), transparent 34%), linear-gradient(90deg, rgb(255 255 255 / .18), transparent 42%, rgb(255 255 255 / .14));
  pointer-events: none;
}

.liquid-glass-web-approx::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  border: 1px solid rgb(255 255 255 / .14);
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .liquid-glass-web-approx {
    border-color: rgb(255 255 255 / .18);
    background: linear-gradient(135deg, rgb(255 255 255 / .16), rgb(255 255 255 / .04)), rgb(15 23 42 / .42);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .22), 0 18px 60px rgb(0 0 0 / .42);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .liquid-glass-web-approx {
    background: rgb(255 255 255 / .96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```
