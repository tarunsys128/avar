import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

// Category-based emoji + color mapping for dairy products
const CATEGORY_STYLES = {
  paneer: { emoji: '🧀', bg: '#FEF3C7', label: 'Paneer' },
  cheese: { emoji: '🧀', bg: '#FDE68A', label: 'Cheese' },
  milk:   { emoji: '🥛', bg: '#DBEAFE', label: 'Milk' },
  butter: { emoji: '🧈', bg: '#FEF9C3', label: 'Butter' },
  chaas:  { emoji: '🥤', bg: '#D1FAE5', label: 'Chaas' },
  curd:   { emoji: '🍶', bg: '#E0E7FF', label: 'Curd' },
  ghee:   { emoji: '🫕', bg: '#FEF3C7', label: 'Ghee' },
  cream:  { emoji: '🍦', bg: '#FCE7F3', label: 'Cream' },
};

const DEFAULT_STYLE = { emoji: '🧀', bg: '#FEF3C7', label: 'Dairy' };

/**
 * A beautiful placeholder for products without images.
 * Shows a large emoji + category label on a soft colored background.
 * 
 * @param {string} category - Product category (paneer, milk, butter, etc.)
 * @param {number} size - Width & height of the placeholder
 * @param {object} style - Additional style overrides
 */
const ProductPlaceholder = ({ category, size = 60, style }) => {
  const cat = CATEGORY_STYLES[category?.toLowerCase()] || DEFAULT_STYLE;
  const emojiSize = Math.max(size * 0.45, 20);

  return (
    <View style={[s.container, { width: size, height: size, backgroundColor: cat.bg }, style]}>
      <Text style={[s.emoji, { fontSize: emojiSize }]}>{cat.emoji}</Text>
      {size >= 50 && (
        <Text style={s.label} numberOfLines={1}>{cat.label}</Text>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default ProductPlaceholder;
