export interface Theme {
  id: string;
  name: string;
  blurb: string;
  /** Swatches shown in the picker: [bg, ink, accent]. */
  swatch: [string, string, string];
  dark: boolean;
  vars: Record<string, string>;
}

const EDITORIAL_SERIF =
  "'Fraunces', 'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";
const DISPLAY_SERIF =
  "'Playfair Display', 'Iowan Old Style', 'Times New Roman', Times, Georgia, serif";
const NEWS_SERIF = "'Libre Caslon Text', 'Times New Roman', Times, Georgia, serif";
const UI_SANS =
  "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const GROTESK =
  "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', monospace";

export const THEMES: Theme[] = [
  {
    id: 'editorial',
    name: 'Editorial',
    blurb: 'Warm cream, near-black ink, high-contrast serif.',
    swatch: ['#F5F1E8', '#171512', '#9C3B2E'],
    dark: false,
    vars: {
      '--bg': '#F5F1E8',
      '--surface': '#FBF8F1',
      '--ink': '#171512',
      '--muted': '#5B5449',
      '--faint': '#8C8477',
      '--rule': '#DED6C6',
      '--accent': '#9C3B2E',
      '--accent-2': '#2F6B4F',
      '--on-accent': '#FBF8F1',
      '--font-display': EDITORIAL_SERIF,
      '--font-sans': UI_SANS,
      '--font-mono': MONO,
      '--display-weight': '600',
      '--display-tracking': '-0.02em',
    },
  },
  {
    id: 'ink',
    name: 'Ink',
    blurb: 'Dark, quiet, built for reading in bed.',
    swatch: ['#141414', '#F0EBE3', '#C97B4A'],
    dark: true,
    vars: {
      '--bg': '#131211',
      '--surface': '#1C1B19',
      '--ink': '#F0EBE3',
      '--muted': '#A8A196',
      '--faint': '#7A736A',
      '--rule': '#2E2C29',
      '--accent': '#D08A52',
      '--accent-2': '#7FB09A',
      '--on-accent': '#131211',
      '--font-display': DISPLAY_SERIF,
      '--font-sans': UI_SANS,
      '--font-mono': MONO,
      '--display-weight': '500',
      '--display-tracking': '-0.015em',
    },
  },
  {
    id: 'deep-winter',
    name: 'Deep Winter',
    blurb: 'Jewel tones on black — crimson, emerald, hard contrast.',
    swatch: ['#0B0D10', '#F2F4F7', '#C8102E'],
    dark: true,
    vars: {
      '--bg': '#0B0D10',
      '--surface': '#14181D',
      '--ink': '#F2F4F7',
      '--muted': '#9FA8B4',
      '--faint': '#6B7480',
      '--rule': '#242A31',
      '--accent': '#D31E3C',
      '--accent-2': '#00A878',
      '--on-accent': '#FFFFFF',
      '--font-display': GROTESK,
      '--font-sans': UI_SANS,
      '--font-mono': MONO,
      '--display-weight': '600',
      '--display-tracking': '-0.03em',
    },
  },
  {
    id: 'newsprint',
    name: 'Newsprint',
    blurb: 'Grey stock, tight rules, everything in Caslon.',
    swatch: ['#E8E6E1', '#1A1A1A', '#1F3A5F'],
    dark: false,
    vars: {
      '--bg': '#E9E7E2',
      '--surface': '#F2F0EC',
      '--ink': '#1A1A1A',
      '--muted': '#4A4A48',
      '--faint': '#7C7C79',
      '--rule': '#C9C6BF',
      '--accent': '#1F3A5F',
      '--accent-2': '#8C2F1E',
      '--on-accent': '#F2F0EC',
      '--font-display': NEWS_SERIF,
      '--font-sans': NEWS_SERIF,
      '--font-mono': MONO,
      '--display-weight': '700',
      '--display-tracking': '-0.01em',
    },
  },
];

export const DEFAULT_THEME = 'editorial';

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyTheme(id: string) {
  if (typeof document === 'undefined') return;
  const theme = themeById(id);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.dataset.theme = theme.id;
  root.style.colorScheme = theme.dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.vars['--bg']);
}
