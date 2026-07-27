import { stringToNumber } from './stringToNumber';

/**
 * The brand green used for the user's own project (--color-brand-500 / seafoam-500).
 */
export const PROJECT_BRAND_COLOR = 'rgb(85 200 145)';

/**
 * Curated set of palette colors for competitor brands.
 *
 * Structured as two complete passes around the hue wheel — first the medium
 * (-500/-600) shades, then the dark (-800/-900) shades — so the first 17
 * indices already span every major hue. Any two brands that hash to nearby
 * indices therefore land on maximally different colors.
 *
 * Green shades are intentionally kept dark (-800/-900 level only) so they
 * remain clearly distinguishable from the project's seafoam-500 brand color.
 * Darker, more saturated shades also read as professional and maintain the
 * visual hierarchy: project = brighter, competitors = deeper.
 */
const COMPETITOR_COLORS = [
  // === Pass 1 — medium shades, full hue wheel (~H=0° → 346°) ===
  'rgb(220 38 38)',   // red-600      — vivid red        (~H=0°)
  'rgb(234 88 12)',   // orange-600   — vivid orange     (~H=22°)
  'rgb(217 119 6)',   // amber-600    — amber            (~H=38°)
  'rgb(202 133 4)',   // yellow-600   — dark gold        (~H=48°)
  'rgb(101 163 13)',  // lime-600     — lime             (~H=80°)
  'rgb(22 163 74)',   // green-600    — vivid green      (~H=142°)
  'rgb(5 150 105)',   // emerald-600  — emerald          (~H=160°)
  'rgb(13 148 136)',  // teal-600     — teal             (~H=175°)
  'rgb(8 145 178)',   // cyan-600     — bright cyan      (~H=193°)
  'rgb(2 132 199)',   // sky-600      — sky blue         (~H=200°)
  'rgb(37 99 235)',   // blue-600     — royal blue       (~H=218°)
  'rgb(79 70 229)',   // indigo-500   — bright indigo    (~H=243°)
  'rgb(124 58 237)',  // violet-500   — vivid violet     (~H=265°)
  'rgb(147 51 234)',  // purple-600   — bright purple    (~H=280°)
  'rgb(192 38 211)',  // fuchsia-600  — fuchsia          (~H=296°)
  'rgb(219 39 119)',  // pink-600     — hot pink         (~H=330°)
  'rgb(225 29 72)',   // rose-600     — vivid rose       (~H=346°)

  // === Pass 2 — dark shades, same hue order ===
  'rgb(153 27 27)',   // red-800      — dark red         (~H=0°)
  'rgb(154 52 18)',   // orange-800   — dark orange      (~H=18°)
  'rgb(146 64 14)',   // amber-800    — dark amber       (~H=35°)
  'rgb(133 77 14)',   // yellow-800   — mustard          (~H=45°)
  'rgb(63 98 18)',    // lime-800     — dark lime        (~H=82°)
  'rgb(20 83 45)',    // green-900    — forest green     (~H=148°)
  'rgb(6 78 59)',     // emerald-900  — dark emerald     (~H=161°)
  'rgb(19 78 74)',    // teal-900     — dark teal        (~H=176°)
  'rgb(14 112 144)',  // cyan-700     — deep cyan        (~H=200°)
  'rgb(12 74 110)',   // sky-900      — dark sky         (~H=202°)
  'rgb(30 64 175)',   // blue-800     — deep blue        (~H=224°)
  'rgb(55 48 163)',   // indigo-800   — dark indigo      (~H=244°)
  'rgb(76 29 149)',   // violet-900   — dark violet      (~H=270°)
  'rgb(88 28 135)',   // purple-900   — dark purple      (~H=281°)
  'rgb(112 26 117)',  // fuchsia-900  — dark fuchsia     (~H=298°)
  'rgb(131 24 67)',   // pink-900     — dark berry       (~H=332°)
  'rgb(136 19 55)',   // rose-900     — dark rose        (~H=347°)
] as const;

/**
 * Returns a deterministic palette color for a competitor brand based on its id.
 * The 34-color palette covers the full hue wheel in two lightness passes, so
 * up to 34 competitors can each have a visually distinct color.
 */
export function getBrandColor(brandId: string): string {
  return COMPETITOR_COLORS[stringToNumber(brandId, COMPETITOR_COLORS.length)];
}
