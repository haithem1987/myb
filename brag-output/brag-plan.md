# Brag Plan: MYB Platform

## What is this app?

MYB is a full-stack coproperty management SaaS — role-aware spaces for syndics, owners, councils, and accountants — all wired to a live Keycloak-authenticated backend.

## The angle

This is real enterprise software built by one person. The angle: show it working, show the role cards landing one by one, show the actual coproperty data. No pitch deck. No feature claims. Just the thing running.

## Hook (first 2-3 seconds)

Tight headline appears on the brand gradient: **"Gérez votre copropriété."** Clean. Direct. Then the logo fades in below it. 2.5s.

## Key moments (the middle)

- The home service picker: 3 role cards slide in one by one — **Espace Syndic**, **Espace Copropriétaire**, **Gestion des utilisateurs** — each with its left-border accent color and icon.
- The coproperty selector screen: two Résidence Ellyssa cards pop in, showing real data (100 lots / 10 000 tantièmes, 8 lots / 1 000 tantièmes). Badges: Active.
- A stat moment: "100 lots · 10 000 tantièmes" — the actual numbers from the live app.

## Outro / punchline

The MYB logo scales in on the brand gradient. Below it: **"Gérez votre copropriété."** Then: **"MYB Platform — En production."** Hard hold. Fade.

## User flow worth showing

1. **Entry** — Home service picker, role cards arriving one by one on the teal-to-purple gradient.
2. **Key action** — Click Espace Syndic → coproperty selector loads.
3. **Result** — Two Résidence Ellyssa cards with real lot/tantième counts and Active badges.

## Tone
- Preset: `app-store`
- Creative direction: clean enterprise demo — show the real thing, no hype
- Interpretation: Feature-card pacing, smooth wipe transitions, medium weight type, title case. The product is the pitch.

## Format: landscape — 1280x720
## Duration: 20s

## Visual identity (from the project)
- Background: `linear-gradient(135deg, #55A697 0%, #8e50a3 100%)`
- Accent primary: `#55A697` (teal)
- Accent secondary: `#8e50a3` (purple)
- Dark text: `#275556`
- Surface: `#ffffff`
- Card border accents: `#1e40af` (syndic blue), `#0891b2` (owner cyan), `#6366f1` (users indigo)
- Display font: Poppins (Google Fonts)
- Body font: Poppins
- Strongest visual element: White service cards with colored left-border on the teal-purple gradient background

## Share copy (draft)

Built MYB — a full coproperty management platform with role-aware spaces for syndics, owners, councils, and accountants. Auth, real data, live backend. Everything you see is running.

## Audio direction
- Role: warm corporate bed, lightly energetic
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` (warm and business-y — fits app-store tone)
- Music treatment: fade in at 0, volume 0.32, fade out over last 1.5s; let final logo hold over the tail
- Music cue guidance: detect at composition time via `npx hyperframes beats`; target strong beats near 4.2s (first card reveal) and 10.5s (coproperty cards)
- Audio-reactive treatment: subtle; RMS drives a gentle glow on the gradient background and card presence breathes with bass
- SFX posture: moderate, app-store energy — `interface/drop_*` per card reveal, `impactBell_heavy_000` on the coproperty data reveal, `impactBell_heavy_003` on the final logo
- Audio-coupled moments: card-by-card arrivals (drop sounds per card), coproperty card data pop-in (bell), logo slam (bell)
- Restraint rule: no glitch, no punch sounds; keep it professional and clean throughout

## Storyboard

### Scene 1 — Hook — 2.5s
On the brand gradient (`#55A697` → `#8e50a3`), the headline **"Gérez votre copropriété."** fades up in white Poppins medium-weight. The MYB logo (`MYB LOGO.png`) fades in beneath it at 1.2s.
Sequential/interaction: none
Audio intent: warm opening, music already playing softly
Audio-coupled idea: headline fades with subtle drop sound at 0.2s
Music: warm and building
Transition mood: clean slide → Scene 2

### Scene 2 — Service Picker — 6s
White surface panel (the home page). Title: **"Services disponibles"** in `#275556`. Three service cards slide in one by one from the right, each ~0.8s apart:
1. **Espace Syndic** — `#1e40af` left border, `bi-building-gear` icon
2. **Espace Copropriétaire** — `#0891b2` left border, `bi-person-badge` icon
3. **Gestion des utilisateurs** — `#6366f1` left border, `bi-people` icon

Each card shows its title and description. The arrow icon on each card.
Sequential/interaction: yes — 3 cards arrive one by one, each with a card-slide sound
Audio intent: light rhythmic energy, each card arrival punctuated
Audio-coupled idea: `casino/card-slide-*` on each card arrival (3 sounds, 0.8s apart)
Music: upbeat bed continuing
Transition mood: clean wipe → Scene 3

### Scene 3 — Coproperty Selector — 6s
The coproperty selector screen. Header: **"Choisissez une copropriété"** in `#275556`. Subtitle: "Sélectionnez la copropriété à gérer dans votre espace syndic."

Two property cards pop in simultaneously:
- **Résidence Ellyssa** — Jardin de Carthage, Tunis — Active badge — **100 lots · 10 000 tantièmes**
- **Residence Ellyssa** — Jardins de Carthage, R7XW+WCW, Tunis — Active badge — **8 lots · 1 000 tantièmes**

Hold on the data for 2.5s so the numbers read clearly.
Sequential/interaction: yes — two cards arrive together with a subtle pop, then stat numbers count up
Audio intent: payoff moment — the data is real
Audio-coupled idea: `impactBell_heavy_000` at the moment the cards fully appear (~0.5s in); stats count up with `casino/chip-lay-*` ticks
Music: bed continues
Transition mood: soft crossfade → Scene 4

### Scene 4 — Outro / Logo — 5.5s
Back to the brand gradient. MYB logo scales in from 0.85→1.0 at 0.4s. Below it:
Line 1: **"MYB Platform"** — white, Poppins bold, 2.2rem — fades in at 0.8s
Line 2: **"Plateforme d'Administration"** — white, Poppins regular, 1.1rem — fades in at 1.3s
Line 3 (smaller): **"En production."** — `rgba(255,255,255,0.75)`, 0.9rem — fades in at 2.0s
Hold all three for 2.5s. Fade to black.
Sequential/interaction: none
Audio intent: resolution — warm landing
Audio-coupled idea: `impactBell_heavy_003` at logo scale-in (0.4s); music fades under the hold
Music: fading out gently from 4.0s
Transition mood: fade to black

**Total: 2.5 + 6 + 6 + 5.5 = 20s ✓**

**Music mood for this video:** upbeat, warm corporate — energetic but not frenetic
**Audio summary:** Warm business-beat bed from scene 1; card sounds punctuate scene 2's sequential reveals; a bell marks the real-data payoff in scene 3; a final bell and fade close the logo in scene 4.
