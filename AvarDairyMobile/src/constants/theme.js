// ─── Avar Dairy Design System ─────────────────────────────────────────────────
// Professional, Vibrant & Modern Interface Identity

export const COLORS = {
  // Brand
  primary:       '#1A63FF',   // Vibrant Royal Corporate Blue (Modern & Professional)
  primaryLight:  '#EEF3FF',   // Super soft blue tint for active states and capsules
  primaryDark:   '#0D47C3',   // Deep, punchy interactive blue
  accent:        '#FFBD12',   // Sharp Gold/Yellow accent for high-end aesthetic

  // Backward compatibility aliases
  yellow:        '#1A63FF',   
  yellowLight:   '#EEF3FF',   
  yellowDark:    '#0D47C3',   
  green:         '#34C759',   // Crisp, universally recognized iOS-style Success Green
  greenLight:    '#EAF9ED',   
  orange:        '#FF9500',   // Vibrant energetic orange

  // Neutrals 
  white:         '#FFFFFF',
  bgLight:       '#F4F6F9',   // Airy, slight cool-tinted background (replaces dull gray)
  bgCard:        '#FFFFFF',   
  border:        '#E8EAED',   // Much softer border color
  borderMed:     '#D2D5DA',

  // Text
  textDark:      '#111827',   // Deep slate instead of pure black for professional readability
  textMed:       '#4B5563',   // Refined grayish-slate
  textGray:      '#6B7280',   // Classy muted placeholder
  textLight:     '#9CA3AF',   

  // Status
  confirmed:     '#34C759',
  preparing:     '#FF9500',
  outForDelivery:'#FF9500',
  delivered:     '#9CA3AF',
  danger:        '#FF3B30',
};

export const FONTS = {
  sizes: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  28,
  },
  weights: {
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
};

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
};

// Extremely professional, modern layered shadows (mimicking Apple/Material You)
export const SHADOW = {
  sm: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
};
