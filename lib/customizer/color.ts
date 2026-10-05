function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/** Perceived brightness 0-255, or null when the colour isn't a hex value. */
export function getBrightness(color: string): number | null {
  const rgb = parseHex(color);
  if (!rgb) return null;
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
}

export function isDarkColor(color: string): boolean {
  const brightness = getBrightness(color);
  return brightness !== null && brightness < 145;
}

function luminance([r, g, b]: [number, number, number]): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Whichever of `light` / `dark` has the better WCAG contrast on `background`. */
export function getContrastColor(background: string, light = "#ffffff", dark = "#0f172a"): string {
  const bg = parseHex(background);
  const l = parseHex(light);
  const d = parseHex(dark);
  if (!bg || !l || !d) return light;
  return contrastRatio(bg, l) >= contrastRatio(bg, d) ? light : dark;
}
const toHex = (rgb: number[]) =>
  `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("")}`;

/** Blends `a` towards `b`; `weight` is how much of `a` is kept (0-1). Non-hex input returns `a`. */
export function mixColors(a: string, b: string, weight: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  return toHex(ca.map((value, i) => value * weight + cb[i] * (1 - weight)));
}