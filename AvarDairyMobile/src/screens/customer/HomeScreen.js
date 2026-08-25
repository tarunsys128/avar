import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import ProductPlaceholder from '../../components/ProductPlaceholder';

const { width } = Dimensions.get('window');

// ─── Custom Carton Counter ────────────────────────────────────────────────────────────
const CustomCartonCounter = ({ item, packSize, qtyLabel }) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartId = `${item.id}-bulk${packSize}`;
  const cartItem = cart.find(c => c.id === cartId);
  const cartons = cartItem?.qty || 0;

  const increment = () => {
    if (cartons === 0) {
      const cartProduct = {
        ...item,
        id: cartId,
        original_id: item.id,
        name: `${item.name} (${packSize}kg Box)`,
        packSize: packSize,
        qtyLabel: qtyLabel || 'box',
        is_wholesale: true,
      };
      addToCart(cartProduct, 1);
    } else {
      updateQuantity(cartId, cartons + 1);
    }
  };
  
  const decrement = () => {
    if (cartons <= 1) removeFromCart(cartId);
    else updateQuantity(cartId, cartons - 1);
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
        <Text style={styles.counterUnit}>{qtyLabel || 'box'}{cartons !== 1 ? (qtyLabel === 'box' ? 'es' : 's') : ''}</Text>
      </View>

      <TouchableOpacity style={[styles.counterBtn, styles.counterBtnPrimary]} onPress={increment}>
        <Ionicons name="add" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Block Card (5kg) ─────────────────────────────────────────────────────────
const BlockCard = ({ productsData }) => {
  const blockProduct = productsData.find(p => p.name.includes('Malai') || p.name.includes('Block')) || productsData[0];
  if (!blockProduct) return null;

  const packSize = 5;
  const { cart } = useCart();
  const cartId = `${blockProduct.id}-bulk${packSize}`;
  const cartItem = cart.find(c => c.id === cartId);
  const cartons = cartItem?.qty || 0;
  
  const totalKg = cartons * packSize;
  const perKgPrice = blockProduct.price_per_kg || 0;
  const cartonPrice = blockProduct.wholesale_price && !blockProduct.packSize ? blockProduct.wholesale_price : perKgPrice * packSize;

  return (
    <View style={[styles.paneerCard, cartons > 0 && styles.paneerCardActive]}>
      {cartons > 0 && <View style={styles.activeStrip} />}
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
         <View style={[styles.iconWrap, cartons > 0 && styles.iconWrapActive]}>
             <Image source={require('../../../assets/paneer_3d.png')} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
         </View>
         <View style={{ flex: 1, marginLeft: SPACING.md }}>
             <Text style={styles.paneerName}>5 kg Paneer Block</Text>
             <Text style={styles.paneerDesc}>Solid Paneer block for bulk cutting.</Text>
         </View>
      </View>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.pricePerKg}>₹{perKgPrice}<Text style={styles.priceUnit}>/kg</Text></Text>
          <Text style={styles.priceCarton}>₹{cartonPrice} per block ({packSize} kg)</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <CustomCartonCounter item={blockProduct} packSize={packSize} qtyLabel="block" />
      
      {cartons > 0 && (
        <View style={styles.kgChip}>
          <Ionicons name="scale-outline" size={12} color={COLORS.primary} />
          <Text style={styles.kgChipTxt}>{totalKg} kg selected (5kg blocks)</Text>
        </View>
      )}
    </View>
  );
}

// ─── Bulk Variant Card (8kg, 16kg, 32kg) ──────────────────────────────────────
const BulkVariantCard = ({ title, subtitle, packSize, productsData }) => {
  const [selectedType, setSelectedType] = useState('Hard');
  
  const typeOptions = [
    { label: 'Hard', id: 'Hard Paneer' },
    { label: 'Soft', id: 'Soft Paneer' },
    { label: 'Analog', id: 'Analog', disabled: true }
  ];

  const activeProduct = productsData.find(p => p.name.includes(selectedType === 'Hard' ? 'Hard' : 'Soft')) || productsData[0];
  if (!activeProduct) return null;

  const { cart } = useCart();
  const cartId = `${activeProduct.id}-bulk${packSize}`;
  const cartItem = cart.find(c => c.id === cartId);
  const cartons = cartItem?.qty || 0;
  
  const totalKg = cartons * packSize;
  const perKgPrice = activeProduct.price_per_kg || 0;
  const cartonPrice = perKgPrice * packSize;

  return (
    <View style={[styles.paneerCard, cartons > 0 && styles.paneerCardActive]}>
      {cartons > 0 && <View style={styles.activeStrip} />}
      
      {/* Header Info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
         <View style={[styles.iconWrap, cartons > 0 && styles.iconWrapActive]}>
             <Image source={require('../../../assets/paneer_3d.png')} style={{ width: 48, height: 48, resizeMode: 'contain' }} />
         </View>
         <View style={{ flex: 1, marginLeft: SPACING.md }}>
             <Text style={styles.paneerName}>{title}</Text>
             <Text style={styles.paneerDesc}>{subtitle}</Text>
         </View>
      </View>

      {/* Tabs for Variant */}
      <View style={styles.variantTabs}>
        {typeOptions.map(opt => (
          <TouchableOpacity 
            key={opt.label}
            style={[
              styles.variantTab, 
              selectedType === opt.label && !opt.disabled && styles.variantTabActive,
              opt.disabled && styles.variantTabDisabled
            ]}
            onPress={() => !opt.disabled && setSelectedType(opt.label)}
            activeOpacity={opt.disabled ? 1 : 0.7}
          >
            <Text style={[
              styles.variantTabTxt, 
              selectedType === opt.label && !opt.disabled && styles.variantTabTxtActive,
              opt.disabled && styles.variantTabTxtDisabled
            ]}>
              {opt.label} {opt.disabled && '(N/A)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.pricePerKg}>₹{perKgPrice}<Text style={styles.priceUnit}>/kg</Text></Text>
          <Text style={styles.priceCarton}>₹{cartonPrice} per box ({packSize} kg)</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <CustomCartonCounter item={activeProduct} packSize={packSize} qtyLabel="box" />
      
      {cartons > 0 && (
        <View style={styles.kgChip}>
          <Ionicons name="scale-outline" size={12} color={COLORS.primary} />
          <Text style={styles.kgChipTxt}>{totalKg} kg selected of {selectedType} Paneer</Text>
        </View>
      )}
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const { cart, getCartTotal, getCartKg, getCartCount } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchData = useCallback(async () => {
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

  const totalCartons = getCartCount();
  const totalKg = getCartKg();
  const cartTotal = getCartTotal();

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
              Order in bulk cartons · Mix any type of box
            </Text>
          </View>
        </View>

        {/* ── Section Title ──────────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="cube" size={17} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Select Paneer Types</Text>
          </View>
        </View>

        {/* ── Product Cards ─────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No Products Available</Text>
            <Text style={styles.emptyTxt}>Paneer products are not available right now. Please try again later.</Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            <BlockCard productsData={products} />
            <BulkVariantCard title="8 kg Box" subtitle="Contains 8 individual packs of 1 kg" packSize={8} productsData={products} />
            <BulkVariantCard title="16 kg Box" subtitle="Contains 16 individual packs of 1 kg" packSize={16} productsData={products} />
            <BulkVariantCard title="32 kg Box" subtitle="Contains 32 individual packs of 1 kg" packSize={32} productsData={products} />
          </View>
        )}

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
                {totalCartons} box{totalCartons !== 1 ? 'es' : ''} · {totalKg} kg
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
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden'
  },
  iconWrapActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },

  // Card text
  paneerName: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  paneerDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4, lineHeight: 19 },
  
  // Variant Tabs
  variantTabs: { 
    flexDirection: 'row', backgroundColor: COLORS.bgLight, borderRadius: RADIUS.md, 
    padding: 4, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border 
  },
  variantTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.sm },
  variantTabActive: { backgroundColor: COLORS.primary, ...SHADOW.sm },
  variantTabDisabled: { opacity: 0.5, backgroundColor: '#F0F0F0' },
  variantTabTxt: { fontSize: FONTS.sizes.sm, color: COLORS.textMed, fontWeight: FONTS.weights.semibold },
  variantTabTxtActive: { color: COLORS.white, fontWeight: FONTS.weights.bold },
  variantTabTxtDisabled: { color: COLORS.textLight, fontSize: 11 },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: SPACING.sm },
  pricePerKg:   { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },
  priceUnit:    { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.regular, color: COLORS.textGray },
  priceCarton:  { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },

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

  // Loading / Empty
  loadingWrap: { alignItems: 'center', paddingVertical: 60 },
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
