import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARTON_KG = 5; // 1 carton = 5 kg

// Map paneer type names to Ionicons
const PANEER_ICONS = {
  'Soft Paneer':  'cube-outline',
  'Hard Paneer':  'layers-outline',
  'Malai Paneer': 'water-outline',
};
const DEFAULT_ICON = 'cube-outline';

// ─── Carton Counter ────────────────────────────────────────────────────────────
const CartonCounter = ({ item }) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = cart.find(c => c.id === item.id);
  const cartons = cartItem?.qty || 0;

  const increment = () => {
    if (cartons === 0) addToCart(item);
    else updateQuantity(item.id, cartons + 1);
  };
  const decrement = () => {
    if (cartons <= 1) removeFromCart(item.id);
    else updateQuantity(item.id, cartons - 1);
  };

  return (
    <View style={styles.counterRow}>
      <TouchableOpacity
        style={[styles.counterBtn, cartons === 0 && styles.counterBtnDisabled]}
        onPress={decrement}
        disabled={cartons === 0}
      >
        <Ionicons name="remove" size={18} color={cartons === 0 ? COLORS.textLight : COLORS.textDark} />
      </TouchableOpacity>

      <View style={styles.counterMid}>
        <Text style={styles.counterNum}>{cartons}</Text>
        <Text style={styles.counterUnit}>carton{cartons !== 1 ? 's' : ''}</Text>
      </View>

      <TouchableOpacity style={[styles.counterBtn, styles.counterBtnPrimary]} onPress={increment}>
        <Ionicons name="add" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Paneer Product Card ───────────────────────────────────────────────────────
const PaneerCard = ({ item }) => {
  const { cart } = useCart();
  const cartItem = cart.find(c => c.id === item.id);
  const cartons = cartItem?.qty || 0;
  const totalKg = cartons * CARTON_KG;
  const iconName = PANEER_ICONS[item.name] || DEFAULT_ICON;
  const cartonPrice = (item.price_per_kg * CARTON_KG).toFixed(0);

  return (
    <View style={[styles.paneerCard, cartons > 0 && styles.paneerCardActive]}>
      {/* Active indicator strip */}
      {cartons > 0 && <View style={styles.activeStrip} />}

      {/* Icon area */}
      <View style={[styles.iconWrap, cartons > 0 && styles.iconWrapActive]}>
        <Ionicons name={iconName} size={32} color={cartons > 0 ? COLORS.white : COLORS.primary} />
      </View>

      {/* Info */}
      <Text style={styles.paneerName}>{item.name}</Text>
      <Text style={styles.paneerDesc} numberOfLines={2}>
        {item.subtitle || `Premium quality ${item.name.toLowerCase()} for wholesale`}
      </Text>

      {/* Pricing */}
      <View style={styles.priceRow}>
        <View>
          <Text style={styles.pricePerKg}>₹{item.price_per_kg}<Text style={styles.priceUnit}>/kg</Text></Text>
          <Text style={styles.priceCarton}>₹{cartonPrice} per carton (5 kg)</Text>
        </View>
        {item.low_stock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="alert-circle" size={10} color={COLORS.danger} style={{ marginRight: 3 }} />
            <Text style={styles.lowStockTxt}>Low Stock</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Counter */}
      <CartonCounter item={item} />

      {/* KG summary */}
      {cartons > 0 && (
        <View style={styles.kgChip}>
          <Ionicons name="scale-outline" size={12} color={COLORS.primary} />
          <Text style={styles.kgChipTxt}>{totalKg} kg selected</Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const { cart, getCartTotal } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
    // Fetch paneer products only
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'Available')
      .ilike('category', 'paneer')
      .order('name', { ascending: true });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const fetchDefaultAddress = useCallback(async () => {
    if (!currentUser?.id) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('is_default', true)
      .maybeSingle();
    if (data) { setDefaultAddress(data); return; }
    const { data: recent } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setDefaultAddress(recent || null);
  }, [currentUser?.id]);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser?.id) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }, [currentUser?.id]);

  useEffect(() => {
    fetchData();
    fetchDefaultAddress();
    fetchUnreadCount();

    const productChannel = supabase
      .channel('paneer-products-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
      .subscribe();

    let notifChannel = null;
    if (currentUser?.id) {
      notifChannel = supabase
        .channel(`home-notifs-${currentUser.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, fetchUnreadCount)
        .subscribe();
    }

    return () => {
      supabase.removeChannel(productChannel);
      if (notifChannel) supabase.removeChannel(notifChannel);
    };
  }, [currentUser?.id]);

  // Cart summary calculations
  const totalCartons = cart.reduce((s, i) => s + i.qty, 0);
  const totalKg = totalCartons * CARTON_KG;
  const cartTotal = cart.reduce((s, i) => s + (i.price_per_kg * CARTON_KG * i.qty), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = (currentUser?.name || 'there').split(' ')[0];

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{firstName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('ProfileTab', { screen: 'CustomerNotifications' })}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.textDark} />
            {unreadCount > 0 && <View style={styles.bellBadge} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Location chip ───────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.locationRow}
        onPress={() => navigation.navigate('ProfileTab', { screen: 'CustomerAddresses' })}
      >
        <Ionicons name="location-outline" size={15} color={COLORS.primary} />
        <Text style={styles.locationTxt} numberOfLines={1}>
          {defaultAddress
            ? `${defaultAddress.label || 'Delivery'}: ${defaultAddress.city || defaultAddress.address}`
            : 'Set Delivery Location'}
        </Text>
        <Ionicons name="chevron-down" size={14} color={COLORS.textGray} style={{ marginLeft: 2 }} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* ── Wholesale Info Banner ─────────────────────────────────── */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <Ionicons name="business-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.infoBannerText}>
            <Text style={styles.infoBannerTitle}>Wholesale Ordering</Text>
            <Text style={styles.infoBannerSub}>
              Order in cartons of 5 kg each · Minimum 1 carton per type
            </Text>
          </View>
        </View>

        {/* ── Section Title ──────────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="cube" size={17} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Select Paneer Types</Text>
          </View>
          <Text style={styles.sectionMeta}>{products.length} available</Text>
        </View>

        {/* ── Product Cards ─────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingTxt}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Products Available</Text>
            <Text style={styles.emptyTxt}>Paneer products are not available right now. Please try again later.</Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {products.map(item => (
              <PaneerCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* ── How It Works ──────────────────────────────────────────── */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How Ordering Works</Text>
          <View style={styles.howRow}>
            <View style={styles.howStep}><Ionicons name="add-circle-outline" size={20} color={COLORS.primary} /></View>
            <Text style={styles.howTxt}>Choose cartons for each paneer type (1 carton = 5 kg)</Text>
          </View>
          <View style={styles.howRow}>
            <View style={styles.howStep}><Ionicons name="cart-outline" size={20} color={COLORS.primary} /></View>
            <Text style={styles.howTxt}>Review your cart and confirm delivery address</Text>
          </View>
          <View style={styles.howRow}>
            <View style={styles.howStep}><Ionicons name="checkmark-circle-outline" size={20} color={COLORS.green} /></View>
            <Text style={styles.howTxt}>We confirm and deliver your bulk order</Text>
          </View>
        </View>

        <View style={{ height: totalCartons > 0 ? 120 : 32 }} />
      </ScrollView>

      {/* ── Cart Summary Bar ──────────────────────────────────────────── */}
      {totalCartons > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartBarInfo}>
            <View style={styles.cartBarIconWrap}>
              <Ionicons name="cart" size={20} color={COLORS.white} />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.cartBarLabel}>
                {totalCartons} carton{totalCartons !== 1 ? 's' : ''} · {totalKg} kg
              </Text>
              <Text style={styles.cartBarTotal}>₹{cartTotal.toFixed(0)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.cartBarBtn}
            onPress={() => navigation.navigate('CartTab')}
          >
            <Text style={styles.cartBarBtnTxt}>Review Order</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft: {},
  greeting:   { fontSize: FONTS.sizes.xs, color: COLORS.textGray, fontWeight: FONTS.weights.medium },
  userName:   { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: SPACING.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, position: 'relative',
  },
  bellBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: COLORS.danger, borderWidth: 1.5, borderColor: COLORS.white,
  },

  // Location
  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  locationTxt: {
    flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textMed,
    marginLeft: 5, fontWeight: FONTS.weights.medium,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryLight, marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  infoBannerIcon: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.md, ...SHADOW.sm,
  },
  infoBannerText: { flex: 1 },
  infoBannerTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.primaryDark },
  infoBannerSub:   { fontSize: FONTS.sizes.xs, color: COLORS.primary, marginTop: 3, lineHeight: 17 },

  // Section
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, marginTop: SPACING.xl, marginBottom: SPACING.md,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  sectionMeta:  { fontSize: FONTS.sizes.xs, color: COLORS.textGray },

  // Cards Grid
  cardsGrid: { paddingHorizontal: SPACING.lg, gap: SPACING.md },

  // Paneer Card
  paneerCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, ...SHADOW.sm,
    borderWidth: 1.5, borderColor: COLORS.border,
    position: 'relative', overflow: 'hidden',
  },
  paneerCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  activeStrip: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
  },

  // Icon
  iconWrap: {
    width: 60, height: 60, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconWrapActive: { backgroundColor: COLORS.primary },

  // Card text
  paneerName: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  paneerDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4, lineHeight: 19 },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: SPACING.md },
  pricePerKg:   { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },
  priceUnit:    { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.regular, color: COLORS.textGray },
  priceCarton:  { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  lowStockBadge:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  lowStockTxt:  { fontSize: 10, color: COLORS.danger, fontWeight: FONTS.weights.bold },

  cardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  // Counter
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterBtn: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  counterBtnDisabled: { opacity: 0.4 },
  counterBtnPrimary:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  counterMid: { alignItems: 'center' },
  counterNum:  { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },
  counterUnit: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: -2 },

  // KG Chip
  kgChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    marginTop: SPACING.sm, backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  kgChipTxt: { fontSize: FONTS.sizes.xs, color: COLORS.primary, fontWeight: FONTS.weights.bold, marginLeft: 4 },

  // How it works
  howCard: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.xl,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, ...SHADOW.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  howTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md },
  howRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  howStep:  { width: 32, alignItems: 'center', paddingTop: 1 },
  howTxt:   { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textMed, lineHeight: 20, marginLeft: 8 },

  // Loading / Empty
  loadingWrap: { alignItems: 'center', paddingVertical: 60 },
  loadingTxt:  { marginTop: SPACING.md, color: COLORS.textGray, fontSize: FONTS.sizes.sm },
  emptyWrap:   { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SPACING.xxxl },
  emptyTitle:  { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginTop: SPACING.lg },
  emptyTxt:    { fontSize: FONTS.sizes.sm, color: COLORS.textGray, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },

  // Cart Bar
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.primaryDark, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...SHADOW.lg, shadowColor: COLORS.primary,
  },
  cartBarInfo: { flexDirection: 'row', alignItems: 'center' },
  cartBarIconWrap: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '50', justifyContent: 'center', alignItems: 'center',
  },
  cartBarLabel: { fontSize: FONTS.sizes.sm, color: COLORS.white + 'CC', fontWeight: FONTS.weights.medium },
  cartBarTotal: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.white },
  cartBarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  cartBarBtnTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.primary },
});

export default HomeScreen;
