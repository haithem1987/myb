# Hyperframes Composition Brief: MYB Platform

## Objective
Create a 20-second app-store-tone launch video for MYB, a coproperty management SaaS platform, showing the real app in action — the role-aware service picker and the live coproperty selector with actual lot/tantième data.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1280x720
- Duration: 20 seconds

## Source Material
- Project root: `C:/DEV/REPOS/myb`
- Primary files read: `apps/admin/src/app/admin-home/admin-home.component.ts`, `libs/shared/custom-styles/src/lib/themes/styles.scss`
- Product name: MYB Platform
- Tagline: "Gérez votre copropriété."
- Logo: `apps/admin/src/assets/MYB LOGO.png` (white version for gradient backgrounds)
- Key UI moment to recreate: The role-aware service picker (white cards with colored left borders on the brand gradient) and the coproperty selector (property cards with lot/tantième stats and Active badges)
- Copy that must appear verbatim:
  - "Gérez votre copropriété."
  - "Services disponibles"
  - "Espace Syndic"
  - "Espace Copropriétaire"
  - "Gestion des utilisateurs"
  - "Choisissez une copropriété"
  - "Résidence Ellyssa"
  - "100 lots · 10 000 tantièmes"
  - "MYB Platform"
  - "Plateforme d'Administration"
  - "En production."

## Creative Direction
- Tone preset: `app-store`
- Creative direction: clean enterprise demo — show the real thing, no hype
- Interpretation: Feature-card pacing, smooth wipe transitions, medium-weight Poppins type, title case throughout. The product is the pitch — no marketing language, just the working app.
- Angle: Real enterprise software, one person, live data. The service cards arriving one by one are the highlight reel.
- Hook: "Gérez votre copropriété." on the brand gradient + MYB logo
- Outro / punchline: MYB logo + "Plateforme d'Administration" + "En production." — clean and confident
- Avoid:
  - Generic SaaS language ("streamline", "empower", "workflow")
  - Abstract filler visuals or color washes
  - Any invented feature claims not present in the codebase

## Visual Identity
- Background gradient: `linear-gradient(135deg, #55A697 0%, #8e50a3 100%)`
- Primary teal: `#55A697`
- Secondary purple: `#8e50a3`
- Dark teal (body text): `#275556`
- Surface (cards): `#ffffff`
- Card border accents: `#1e40af` (syndic), `#0891b2` (owner), `#6366f1` (users)
- Active badge: green (`#198754`)
- Display font: Poppins (load from Google Fonts or local fallback sans-serif)
- Body font: Poppins
- Visual references: White service cards with 4px colored left border, box-shadow, border-radius 12px, on the teal-purple gradient

## Storyboard

Scene summary:
1. **Hook** — 2.5s — "Gérez votre copropriété." headline + MYB logo on gradient
2. **Service Picker** — 6s — 3 role cards arrive one by one (Syndic, Owner, Users)
3. **Coproperty Selector** — 6s — 2 property cards with real lot/tantième data
4. **Outro** — 5.5s — MYB logo + "Plateforme d'Administration" + "En production." on gradient, fade to black

Full storyboard in `brag-output/brag-plan.md`.

## Audio
- Audio role: warm corporate bed, lightly energetic
- Audio arc: music starts soft under the hook, energizes through card reveals, settles under the coproperty data, fades gently under the logo outro
- Music: `assets/music/happy-beats-business-moves-vol-11-by-ende-dot-app.mp3`
- Music treatment: start at 0s, volume 0.32, fade out over the last 1.5s (18.5s→20s); the final bell SFX rings over the fade
- Music cue guidance: detect at composition time via `npx hyperframes beats`; target strong beats near 4.2s (first card reveal in Scene 2) and ~10s (coproperty cards reveal in Scene 3); 1-2 strong cue locks only
- Audio-reactive treatment: subtle; use RMS/bass to make the gradient background glow breathe gently and the card panel presence pulse slightly on bass hits — no waveform visuals, no strobing
- Audio-coupled moments:
  - Scene 1 headline fade-in — `interface/drop_001` at 0.2s (soft opening accent)
  - Scene 2 card 1 arrival — `casino/card-slide-2.ogg` at ~2.7s
  - Scene 2 card 2 arrival — `casino/card-slide-3.ogg` at ~3.5s
  - Scene 2 card 3 arrival — `casino/card-slide-4.ogg` at ~4.3s (beat-locked near 4.23s)
  - Scene 3 property cards appear — `impact/impactBell_heavy_000.ogg` at ~8.6s (beat-locked near strong cue)
  - Scene 4 logo scales in — `impact/impactBell_heavy_003.ogg` at ~14.9s
- SFX selection guidance: card-slide sounds for the sequential card reveals; a resonant bell for the coproperty data payoff; a deeper bell for the logo outro; all at 0.65-0.75 volume; nothing punchy or aggressive
- SFX analysis guidance: `C:/Users/haith/.claude/plugins/cache/brag/brag/0.4.0/skills/brag/assets/sfx/sfx-analysis.md`
- Exact SFX choice: Hyperframes should adjust filenames, timestamps, and volume based on the implemented animation
- Audio files: copy chosen music and SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load hyperframes-core, hyperframes-animation, hyperframes-creative, hyperframes-keyframes, and hyperframes-cli. Do not enter the hyperframes intent interview or generic promo workflow — this is a /brag composition.

Requirements:
- Scene 2 cards must arrive one by one (sequential reveal, not simultaneous) — this is the centerpiece interaction moment
- Scene 3 must show property cards with the exact lot/tantième numbers (100 lots · 10 000 tantièmes) and Active badges
- All text must be readable in render; hold each text element at the reading-time floor
- Music and SFX layer required as specified
- Beat-lock at least 1 major tween (card 3 arrival or coproperty reveal) to a strong beat from `hyperframes beats`
- At least one visual element subtly reacts to the music RMS (gradient glow or card presence)
- `hyperframes check` must pass before render
- Total duration: exactly 20s
