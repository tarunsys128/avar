import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

// Category-based icon + color mapping for dairy products
const CATEGORY_STYLES = {
  paneer: { image: require('../../assets/paneer_3d.webp'), bg: '#FFFFFF', label: 'Paneer' },
  cheese: { image: require('../../assets/cheese_3d.webp'), bg: '#FFFFFF', label: 'Cheese' },
  milk:   { icon: 'water-outline', bg: '#DBEAFE', label: 'Milk', color: '#1E3A8A' },
  butter: { icon: 'layers-outline', bg: '#FEF9C3', label: 'Butter', color: '#92400E' },
  chaas:  { icon: 'beer-outline', bg: '#D1FAE5', label: 'Chaas', color: '#065F46' },
  curd:   { icon: 'aperture-outline', bg: '#E0E7FF', label: 'Curd', color: '#3730A3' },
  ghee:   { icon: 'flask-outline', bg: '#FEF3C7', label: 'Ghee', color: '#92400E' },
  cream:  { icon: 'ice-cream-outline', bg: '#FCE7F3', label: 'Cream', color: '#9D174D' },
};

const DEFAULT_STYLE = { icon: 'cube-outline', bg: '#F3F4F6', label: 'Dairy', color: '#4B5563' };

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
    <View style={[s.container, { width: size, height: size, backgroundColor: cat.bg, overflow: 'hidden' }, style]}>
      {cat.image ? (
        <Image source={cat.image} style={{ width: size * 0.9, height: size * 0.9, resizeMode: 'contain' }} />
      ) : (
        <>
          <Ionicons name={cat.icon} size={emojiSize} color={cat.color || '#92400E'} style={s.icon} />
          {size >= 50 && (
            <Text style={[s.label, cat.color && { color: cat.color }]} numberOfLines={1}>{cat.label}</Text>
          )}
        </>
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
  icon: {
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
