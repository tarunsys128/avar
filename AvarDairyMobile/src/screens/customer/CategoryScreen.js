import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../supabase';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const CATEGORIES = [
  { id: 'all',    label: 'All',    icon: 'apps-outline' },
  { id: 'paneer', label: 'Paneer', icon: 'cube-outline' },
  { id: 'cheese', label: 'Cheese', icon: 'ellipse-outline' },
  { id: 'milk',   label: 'Milk',   icon: 'water-outline' },
  { id: 'butter', label: 'Butter', icon: 'layers-outline' },
  { id: 'chaas',  label: 'Chaas',  icon: 'beer-outline' },
  { id: 'others', label: 'Others', icon: 'grid-outline' },
];

// Icon mapping for product fallback (when no image_url)
const PRODUCT_ICON_MAP = {
  paneer: 'cube-outline',
  cheese: 'ellipse-outline',
  milk: 'water-outline',
  butter: 'layers-outline',
  chaas: 'beer-outline',
};

// ─── Qty Button ────────────────────────────────────────────────────────────────
const QtyControl = ({ item }) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = cart.find(c => c.id === item.id);
  const qty = cartItem?.qty || 0;

  if (item.status === 'OutOfStock') {
    return (
      <View style={[s.addCircle, { width: 'auto', paddingHorizontal: 12, backgroundColor: COLORS.bgLight, borderRadius: RADIUS.md }]}>
        <Text style={{ color: COLORS.textGray, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold }}>Out of Stock</Text>
      </View>
    );
  }

  if (item.status === 'ComingSoon') {
    return (
      <View style={[s.addCircle, { width: 'auto', paddingHorizontal: 12, backgroundColor: COLORS.yellowLight, borderRadius: RADIUS.md }]}>
        <Text style={{ color: '#B45309', fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold }}>Coming Soon</Text>
      </View>
    );
  }

  if (qty === 0) {
    return (
      <TouchableOpacity style={s.addCircle} onPress={() => addToCart(item)}>
        <Ionicons name="add" size={22} color={COLORS.white} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.stepper}>
      <TouchableOpacity
        style={s.stepBtn}
        onPress={() => qty === 1 ? removeFromCart(item.id) : updateQuantity(item.id, qty - 1)}
      >
        <Ionicons name="remove" size={16} color={COLORS.textDark} />
      </TouchableOpacity>
      <Text style={s.stepCount}>{qty}</Text>
      <TouchableOpacity
        style={[s.stepBtn, { backgroundColor: COLORS.green, borderColor: COLORS.green }]}
        onPress={() => updateQuantity(item.id, qty + 1)}
      >
        <Ionicons name="add" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Product Row ───────────────────────────────────────────────────────────────
const ProductRow = ({ item }) => {
  const iconName = PRODUCT_ICON_MAP[item.category?.toLowerCase()] || 'cube-outline';
  return (
    <View style={s.productRow}>
      <View style={s.productImg}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={s.fullImg} />
        ) : (
          <View style={s.productIconFallback}>
            <Ionicons name={item.emoji || iconName} size={32} color={COLORS.primary} />
          </View>
        )}
      </View>
      <View style={s.productInfo}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
           <Text style={s.productName} numberOfLines={1}>{item.name}</Text>
           {item.is_wholesale && <View style={s.badgeWholesale}><Text style={s.badgeWholesaleTxt}>B2B</Text></View>}
        </View>
        
        {item.subtitle ? <Text style={s.productSub} numberOfLines={1}>{item.subtitle}</Text> : null}

        {item.is_retail && (
          <Text style={s.productPrice}>₹{item.retail_price || item.price_per_kg} <Text style={s.unitTxt}>/ {item.unit_type || 'kg'}</Text></Text>
        )}
        
        {item.is_wholesale && (
          <Text style={s.bulkPrice}>Carton ({item.wholesale_qty || '-'} {item.unit_type}): ₹{item.wholesale_price || '-'}</Text>
        )}
      </View>
      <View style={s.qtyWrapper}>
        <QtyControl item={item} />
      </View>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const CategoryScreen = ({ navigation, route }) => {
  const initialCategory = route?.params?.categoryKey || 'all';
  const { cart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(initialCategory);

  // Sync if route params change (e.g. navigating from Home with a specific category)
  useEffect(() => {
    if (route?.params?.categoryKey) {
      setActiveCat(route.params.categoryKey);
    }
  }, [route?.params?.categoryKey]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('is_bestseller', { ascending: false });

    if (!error && data) {
      setProducts(data.map(p => ({
        ...p,
        price: p.price_per_kg,
        subtitle: p.subtitle || '',
      })));
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    if (activeCat === 'all') return true;
    return p.category?.toLowerCase() === activeCat.toLowerCase();
  });

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const selectedCategoryLabel = CATEGORIES.find(c => c.id === activeCat)?.label || 'Products';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ──────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Explore Menu</Text>
        <View style={s.headerRight}>
          <TouchableOpacity style={[s.iconBtn, { position: 'relative' }]} onPress={() => navigation.navigate('CartTab')}>
            <Ionicons name="cart" size={22} color={COLORS.textDark} />
            {cartCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeTxt}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Categories Row ──────────── */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[s.filterChip, activeCat === cat.id && s.filterChipActive]}
              onPress={() => setActiveCat(cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={activeCat === cat.id ? COLORS.white : COLORS.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[s.filterChipTxt, activeCat === cat.id && s.filterChipTxtActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Product List ──────── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <Text style={s.countLabel}>{filteredProducts.length} {selectedCategoryLabel} Items</Text>
          <FlatList
            data={filteredProducts}
            keyExtractor={i => i.id}
            renderItem={({ item }) => <ProductRow item={item} />}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="cube-outline" size={48} color={COLORS.textLight} />
                <Text style={s.emptyTxt}>No products found in this category</Text>
              </View>
            }
          />
        </>
      )}

      {/* ── Cart FAB ─── */}
      {cartCount > 0 && (
        <TouchableOpacity style={s.cartFab} onPress={() => navigation.navigate('CartTab')}>
          <Ionicons name="cart" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={s.cartFabTxt}>View Cart  ·  {cartCount} items</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    ...SHADOW.sm,
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  badgeTxt: { fontSize: 9, color: COLORS.white, fontWeight: FONTS.weights.bold },

  // Filters
  filterRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: 10 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipTxt: { fontSize: FONTS.sizes.sm, color: COLORS.textMed, fontWeight: FONTS.weights.medium },
  filterChipTxtActive: { color: COLORS.white, fontWeight: FONTS.weights.bold },

  // Count
  countLabel: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textGray },

  // List
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },

  // Product Row
  productRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  productImg: {
    width: 70, height: 70, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
    overflow: 'hidden',
  },
  productIconFallback: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  fullImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  productInfo: { flex: 1 },
  productName:  { flex: 1, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  productSub:   { fontSize: FONTS.sizes.xs,  color: COLORS.textGray, marginTop: 2 },
  productPrice: { fontSize: FONTS.sizes.md,  fontWeight: FONTS.weights.extrabold, color: COLORS.green, marginTop: 4 },
  unitTxt:      { fontSize: FONTS.sizes.xs, color: COLORS.textGray, fontWeight: FONTS.weights.medium },
  bulkPrice:    { fontSize: 10, color: '#9333EA', fontWeight: FONTS.weights.bold, marginTop: 2 },
  badgeWholesale: { backgroundColor: '#F3E8FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  badgeWholesaleTxt: { color: '#9333EA', fontSize: 9, fontWeight: 'bold' },
  qtyWrapper: { marginLeft: 8 },

  // Add / Stepper
  addCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center', ...SHADOW.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgLight },
  stepCount:  { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark, minWidth: 20, textAlign: 'center' },

  // Empty
  empty:    { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyTxt: { color: COLORS.textGray, fontSize: FONTS.sizes.base, textAlign: 'center', marginTop: 12 },

  // Cart FAB
  cartFab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    ...SHADOW.lg, shadowColor: COLORS.primary,
  },
  cartFabTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },
});

export default CategoryScreen;
