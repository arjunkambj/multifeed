/**
 * The marketing page's shared spacing and type tokens.
 *
 * `Section` owns the page's outer rhythm (gutters + section padding); this file
 * owns the rhythm inside a section. Every value here is used in more than one
 * component — if a decision only applies once, it stays inline at the call site.
 */

/** Gap between a `SectionHeader` and the body it introduces. */
export const HEADER_GAP = "mt-12 md:mt-16";

/** Gap between cards or tiles in any grid on the page. */
export const GRID_GAP = "gap-3 md:gap-4";

/** Padding inside a standalone card or tile. */
export const CARD_PADDING = "p-6";

/** Padding for the copy column of a full-width panel. */
export const PANEL_PADDING =
  "px-6 py-8 sm:px-8 md:px-9 md:py-9 lg:px-10 lg:py-10";

/** Media column of a full-width panel — steps with `PANEL_PADDING`. */
export const PANEL_MEDIA =
  "min-h-[280px] sm:min-h-[340px] md:min-h-[420px] lg:min-h-[480px]";

/** Heading inside a panel — one step below `SectionHeader`'s h2. */
export const PANEL_HEADING =
  "font-heading text-[1.375rem] leading-[1.2] font-medium tracking-[-0.025em] text-balance md:text-[1.625rem]";

/** Quiet label above a heading. Matches `SectionHeader`'s eyebrow exactly. */
export const EYEBROW = "text-sm leading-5 text-muted-foreground";

/** All-caps strip label ("Featured on", pricing group headings). */
export const OVERLINE =
  "text-[0.6875rem] leading-4 font-semibold tracking-[0.12em] uppercase";

/** Default paragraph size for body copy inside panels and cards. */
export const BODY = "text-[0.9375rem] leading-7 text-pretty";

/** Solid status chip used on floating product cards. */
export const SOFT_CHIP =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.6875rem] leading-4 font-medium text-primary dark:bg-primary/15";

/** Floating product mock over a photo. Page background, not card. */
export const MOCK_CARD =
  "absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-card border bg-background p-4 shadow-2xl shadow-black/10 sm:inset-x-8 sm:p-5";

/** Full product window over a photo. Same chrome as MOCK_CARD, sized for the
    hero dashboard rather than a floating snippet. */
export const MOCK_FRAME =
  "overflow-hidden rounded-card border bg-background shadow-2xl shadow-black/10";

/** Supported platforms, in one order, with one icon set. Hero, Features and
    Pricing each render this list so the strips never drift apart. */
export const platforms = [
  { label: "Twitter/X", icon: "simple-icons:x", color: "#000000" },
  { label: "Instagram", icon: "simple-icons:instagram", color: "#E4405F" },
  { label: "LinkedIn", icon: "simple-icons:linkedin", color: "#0A66C2" },
  { label: "Facebook", icon: "simple-icons:facebook", color: "#1877F2" },
  { label: "TikTok", icon: "simple-icons:tiktok", color: "#000000" },
  { label: "YouTube", icon: "simple-icons:youtube", color: "#FF0000" },
] as const;

/** Icon size for the flat platform strips in Hero and Pricing. */
export const PLATFORM_ICON = "size-[22px] md:size-6";
