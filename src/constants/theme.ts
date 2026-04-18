// Marina design tokens — extracted from UI design
export const colors = {
  primary: '#8ff5ff',
  primaryContainer: '#00eefc',
  secondary: '#5af8fb',
  secondaryContainer: '#00696b',
  tertiary: '#ebfdff',
  surface: '#051011',
  surfaceDim: '#051011',
  surfaceBright: '#1d2f31',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#081517',
  surfaceContainer: '#0d1c1d',
  surfaceContainerHigh: '#122223',
  surfaceContainerHighest: '#17292a',
  onSurface: '#e9f6f7',
  onSurfaceVariant: '#a0aeae',
  outline: '#6b7879',
  outlineVariant: '#3e4a4b',
  error: '#ff716c',
  success: '#00c864',
  glass: 'rgba(23,41,42,0.6)',
  glassBorder: 'rgba(62,74,75,0.3)',
};

export const typography = {
  headline: 'SpaceGrotesk',
  body: 'Manrope',
  sizes: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, xxxl: 32, hero: 48 },
  weights: { light: '300' as const, regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
  tracking: { tight: -0.5, normal: 0, wide: 1, wider: 2, widest: 3 },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const borderRadius = { sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999 };
