# Taste Like Honey

## Theming

- Base radius: `--radius: 0.5rem` (8px), set in `src/styles/globals.css`. All `rounded-*` tokens derive from it via the multiplier scale in `@theme inline`.
- Cards: no shadow, no border/ring. Flat surface with bg-card and radius only (`src/components/ui/card.tsx`).
- Inputs: no focus ring/glow. Border turns `border-primary` on focus-visible (`src/components/ui/input.tsx`).
- Background: never pure white/black. Use a tinted neutral from the palette (e.g. `neutral-50`, `zinc-50`) instead of `white`/`black`.
- Card color: about 2 palette steps higher than the background (e.g. bg `neutral-50` → card `neutral-200/50`).
- Sidebar: same background color as the main page background, in both light and dark mode (no separate sidebar surface).
