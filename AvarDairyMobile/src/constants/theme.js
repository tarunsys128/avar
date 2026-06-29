// ─── Avar Dairy Design System ─────────────────────────────────────────────────
// Matches the reference image color palette

export const COLORS = {
  // Brand
  primary:       '#0059A4',   // Avar Blue from logo
  primaryLight:  '#E6F0F9',   // Light blue background
  primaryDark:   '#00427A',   // Darker blue for active states
  accent:        '#F5B800',   // Keeping the gold/yellow as an accent
  // Backward compatibility aliases
  yellow:        '#0059A4',   // Maps to primary (Avar Blue)
  yellowLight:   '#E6F0F9',   // Maps to primaryLight
  yellowDark:    '#00427A',   // Maps to primaryDark
  green:         '#4CAF50',   // Confirmed, free delivery, add btn
  greenLight:    '#E8F5E9',   // Green tint bg
  orange:        '#FF8C00',   // Preparing/delivery status

  // Neutrals
  white:         '#FFFFFF',
  bgLight:       '#F8F8F8',   // Screen background
  bgCard:        '#FFFFFF',   // Card background
  border:        '#EFEFEF',   // Dividers & borders
  borderMed:     '#E0E0E0',

  // Text
  textDark:      '#1A1A1A',   // Primary text
  textMed:       '#555555',   // Secondary text
  textGray:      '#888888',   // Muted / placeholder
  textLight:     '#AAAAAA',   // Very muted

  // Status
  confirmed:     '#4CAF50',
  preparing:     '#FF8C00',
  outForDelivery:'#FF8C00',
  delivered:     '#AAAAAA',
  danger:        '#F44336',
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

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
};
