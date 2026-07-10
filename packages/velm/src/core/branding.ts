export interface VelmBranding {
  brandName: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  copyrightText?: string;
  fontFamily: string;
  fontUrl?: string;
  primaryColor: string;
  accentColor: string;
}

export const DEFAULT_VELM_BRANDING: VelmBranding = {
  brandName: 'Admin',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  primaryColor: '#f1511b',
  accentColor: '#286291',
};

const ENV_KEYS = {
  brandName: 'VELM_BRAND_NAME',
  logoUrl: 'VELM_BRAND_LOGO_URL',
  logoDarkUrl: 'VELM_BRAND_LOGO_DARK_URL',
  copyrightText: 'VELM_BRAND_COPYRIGHT',
  fontFamily: 'VELM_BRAND_FONT_FAMILY',
  fontUrl: 'VELM_BRAND_FONT_URL',
  primaryColor: 'VELM_BRAND_PRIMARY_COLOR',
  accentColor: 'VELM_BRAND_ACCENT_COLOR',
} as const;

export function brandingFromEnv(
  env: Record<string, string | undefined> = process.env,
): Partial<VelmBranding> {
  const branding: Partial<VelmBranding> = {};

  if (env[ENV_KEYS.brandName]?.trim()) {
    branding.brandName = env[ENV_KEYS.brandName]!.trim();
  }
  if (env[ENV_KEYS.logoUrl]?.trim()) {
    branding.logoUrl = env[ENV_KEYS.logoUrl]!.trim();
  }
  if (env[ENV_KEYS.logoDarkUrl]?.trim()) {
    branding.logoDarkUrl = env[ENV_KEYS.logoDarkUrl]!.trim();
  }
  if (env[ENV_KEYS.copyrightText]?.trim()) {
    branding.copyrightText = env[ENV_KEYS.copyrightText]!.trim();
  }
  if (env[ENV_KEYS.fontFamily]?.trim()) {
    branding.fontFamily = env[ENV_KEYS.fontFamily]!.trim();
  }
  if (env[ENV_KEYS.fontUrl]?.trim()) {
    branding.fontUrl = env[ENV_KEYS.fontUrl]!.trim();
  }
  if (env[ENV_KEYS.primaryColor]?.trim()) {
    branding.primaryColor = normalizeHexColor(env[ENV_KEYS.primaryColor]!.trim());
  }
  if (env[ENV_KEYS.accentColor]?.trim()) {
    branding.accentColor = normalizeHexColor(env[ENV_KEYS.accentColor]!.trim());
  }

  return branding;
}

export function mergeBranding(
  base: VelmBranding,
  override?: Partial<VelmBranding>,
): VelmBranding {
  if (!override) return { ...base };
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(override).filter(([, value]) => value !== undefined && value !== ''),
    ),
  };
}

export function resolveBranding(
  moduleBranding?: Partial<VelmBranding>,
  companyBranding?: Partial<VelmBranding>,
  legacyTitle?: string,
): VelmBranding {
  const modulePartial: Partial<VelmBranding> = { ...moduleBranding };
  if (legacyTitle && !modulePartial.brandName) {
    modulePartial.brandName = legacyTitle;
  }
  let resolved = mergeBranding(DEFAULT_VELM_BRANDING, modulePartial);
  resolved = mergeBranding(resolved, companyBranding);
  return resolved;
}

export function buildBrandingCss(branding: VelmBranding): string {
  const primary = normalizeHexColor(branding.primaryColor) ?? DEFAULT_VELM_BRANDING.primaryColor;
  const accent = normalizeHexColor(branding.accentColor) ?? DEFAULT_VELM_BRANDING.accentColor;
  const fontFamily = branding.fontFamily;

  return `/* Velm branding — generated at runtime */
:root {
  --velm-font-family: ${fontFamily};
  --color-primary-500: ${primary};
  --color-primary-50: color-mix(in srgb, ${primary} 10%, white);
  --color-primary-100: color-mix(in srgb, ${primary} 20%, white);
  --color-primary-200: color-mix(in srgb, ${primary} 35%, white);
  --color-primary-300: color-mix(in srgb, ${primary} 55%, white);
  --color-primary-400: color-mix(in srgb, ${primary} 78%, white);
  --color-primary-600: color-mix(in srgb, ${primary} 88%, black);
  --color-primary-700: color-mix(in srgb, ${primary} 75%, black);
  --color-primary-800: color-mix(in srgb, ${primary} 62%, black);
  --color-primary-900: color-mix(in srgb, ${primary} 48%, black);
  --color-primary-950: color-mix(in srgb, ${primary} 32%, black);
  --color-velm-primary: ${primary};
  --color-velm-primary-50: color-mix(in srgb, ${primary} 10%, white);
  --color-velm-primary-100: color-mix(in srgb, ${primary} 20%, white);
  --color-velm-primary-600: ${primary};
  --color-velm-primary-700: color-mix(in srgb, ${primary} 75%, black);
  --color-velm-primary-800: color-mix(in srgb, ${primary} 62%, black);
  --color-fg-brand: ${primary};
  --color-fg-brand-strong: color-mix(in srgb, ${primary} 62%, black);
  --color-brand-soft: color-mix(in srgb, ${primary} 20%, white);
  --color-brand-softer: color-mix(in srgb, ${primary} 20%, white);
  --color-default: color-mix(in srgb, ${primary} 35%, white);
  --color-neutral-secondary: color-mix(in srgb, ${primary} 10%, white);
  --color-neutral-tertiary: color-mix(in srgb, ${primary} 20%, white);
  --color-velm-shell: color-mix(in srgb, color-mix(in srgb, ${primary} 10%, white) 35%, white);
  --color-velm-accent: ${accent};
  --color-velm-accent-50: color-mix(in srgb, ${accent} 12%, white);
  --color-velm-accent-100: color-mix(in srgb, ${accent} 22%, white);
  --color-velm-accent-600: ${accent};
  --color-velm-accent-700: color-mix(in srgb, ${accent} 78%, black);
}

.dark {
  --color-fg-brand: ${primary};
  --color-fg-brand-strong: color-mix(in srgb, ${primary} 78%, white);
  --color-brand-soft: color-mix(in srgb, ${primary} 48%, black);
  --color-brand-softer: color-mix(in srgb, ${primary} 32%, black);
  --color-velm-shell: var(--color-gray-800);
  --color-neutral-primary: var(--color-gray-900);
  --color-neutral-secondary: var(--color-gray-800);
  --color-neutral-tertiary: #151c28;
  --color-default: var(--color-gray-700);
  --color-surface-hover: color-mix(in srgb, var(--color-gray-700) 50%, var(--color-gray-900));
  --color-surface-header: color-mix(in srgb, var(--color-gray-800) 65%, var(--color-gray-900));
  --color-surface-inset: color-mix(in srgb, var(--color-gray-800) 55%, var(--color-gray-900));
  --color-surface-row-hover: color-mix(in srgb, var(--color-gray-700) 35%, var(--color-gray-900));
  --color-badge-neutral: color-mix(in srgb, var(--color-gray-700) 45%, var(--color-gray-900));
}

body {
  font-family: var(--velm-font-family);
}
`;
}

export function normalizeHexColor(value: string): string | undefined {
  const trimmed = value.trim();
  const match = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return undefined;
  const hex = match[1]!;
  if (hex.length === 3) {
    return `#${hex
      .split('')
      .map((char) => char + char)
      .join('')}`;
  }
  return `#${hex.toLowerCase()}`;
}

export { ENV_KEYS as VELM_BRANDING_ENV_KEYS };
