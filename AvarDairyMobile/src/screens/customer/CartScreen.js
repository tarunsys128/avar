import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const CARTON_KG = 5;

// ─── Stepper ───────────────────────────────────────────────────────────────────
const Stepper = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  return (
    <View style={s.stepper}>
      <TouchableOpacity
        style={s.stepBtn}
        onPress={() => item.qty === 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.qty - 1)}
      >
        <Ionicons name="remove" size={16} color={COLORS.textDark} />
      </TouchableOpacity>
      <View style={s.stepMid}>
        <Text style={s.stepCount}>{item.qty}</Text>
        <Text style={s.stepUnit}>ctn</Text>
      </View>
      <TouchableOpacity
        style={[s.stepBtn, s.stepBtnPrimary]}
        onPress={() => updateQuantity(item.id, item.qty + 1)}
      >
        <Ionicons name="add" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Cart Screen ───────────────────────────────────────────────────────────────
const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart, getCartTotal, getCartKg, getCartCount, clearCart } = useCart();
  const canGoBack = navigation.canGoBack();

  const subtotal   = getCartTotal();
  const totalKg    = getCartKg();
  const totalCartons = getCartCount();

  const handlePlaceOrder = () => navigation.navigate('AddressSelection');

  if (cart.length === 0) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="cart-outline" size={48} color={COLORS.textLight} />
          </View>
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Add paneer types from the home screen to build your wholesale order.</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
            <Ionicons name="arrow-back" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={s.shopBtnTxt}>Back to Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
          </TouchableOpacity>
        ) : <View style={{ width: 38 }} />}
        <Text style={s.headerTitle}>Review Order</Text>
        <TouchableOpacity onPress={clearCart} style={s.clearBtn}>
          <Text style={s.clearBtnTxt}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Order summary chips */}
        <View style={s.summaryStrip}>
          <View style={s.summaryChip}>
            <Ionicons name="layers-outline" size={14} color={COLORS.primary} />
            <Text style={s.summaryChipTxt}>{totalCartons} carton{totalCartons !== 1 ? 's' : ''}</Text>
          </View>
          <View style={s.summaryDot} />
          <View style={s.summaryChip}>
            <Ionicons name="scale-outline" size={14} color={COLORS.primary} />
            <Text style={s.summaryChipTxt}>{totalKg} kg total</Text>
          </View>
          <View style={s.summaryDot} />
          <View style={s.summaryChip}>
            <Ionicons name="cube-outline" size={14} color={COLORS.primary} />
            <Text style={s.summaryChipTxt}>{cart.length} type{cart.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Cart Items */}
        <Text style={s.sectionLabel}>ITEMS IN ORDER</Text>
        {cart.map(item => {
          const itemKg = item.qty * CARTON_KG;
          const itemTotal = item.price_per_kg * CARTON_KG * item.qty;
          return (
            <View key={item.id} style={s.cartCard}>
              <View style={s.itemIconWrap}>
                <Ionicons name="cube" size={24} color={COLORS.primary} />
              </View>
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemSub}>₹{item.price_per_kg}/kg · {itemKg} kg</Text>
                <View style={s.itemFooter}>
                  <Text style={s.itemTotal}>₹{itemTotal.toFixed(0)}</Text>
                  <Stepper item={item} />
                </View>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.id)} style={s.trashBtn}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Bill Details */}
        <View style={s.billCard}>
          <Text style={s.billTitle}>Order Summary</Text>

          {cart.map(item => (
            <View key={item.id} style={s.billRow}>
              <Text style={s.billLabel}>{item.name} ({item.qty} × 5 kg)</Text>
              <Text style={s.billValue}>₹{(item.price_per_kg * CARTON_KG * item.qty).toFixed(0)}</Text>
            </View>
          ))}

          <View style={s.billDivider} />

          <View style={s.billRow}>
            <Text style={s.billLabel}>Total Weight</Text>
            <Text style={s.billValue}>{totalKg} kg</Text>
          </View>

          <View style={s.billDivider} />

          <View style={s.totalRow}>
            <View>
              <Text style={s.totalLabel}>Grand Total</Text>
              <Text style={s.totalSub}>Excl. delivery charges</Text>
            </View>
            <Text style={s.totalValue}>₹{subtotal.toFixed(0)}</Text>
          </View>
        </View>

        <View style={s.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={s.noteTxt}>Delivery charges will be calculated at checkout based on your location.</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Place Order Footer */}
      <View style={s.footerBar}>
        <View style={s.footerInfo}>
          <Text style={s.footerLabel}>{totalCartons} cartons · {totalKg} kg</Text>
          <Text style={s.footerValue}>₹{subtotal.toFixed(0)}</Text>
        </View>
        <TouchableOpacity style={s.placeBtn} onPress={handlePlaceOrder}>
          <Text style={s.placeBtnTxt}>Confirm Address</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.bgLight },
  scroll: { padding: SPACING.lg, paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.sm,
  },
  backBtn:     { width: 38, alignItems: 'flex-start' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  clearBtn:    { width: 50, alignItems: 'flex-end' },
  clearBtnTxt: { color: COLORS.danger, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg, gap: SPACING.sm,
  },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryChipTxt: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: FONTS.weights.semibold },
  summaryDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary + '50' },

  sectionLabel: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textGray, marginBottom: SPACING.md, letterSpacing: 0.5 },

  // Cart Card
  cartCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm,
    alignItems: 'flex-start', borderWidth: 1, borderColor: COLORS.border,
  },
  itemIconWrap: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.md,
  },
  itemInfo:  { flex: 1 },
  itemName:  { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  itemSub:   { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  itemFooter:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  itemTotal: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },
  trashBtn:  { padding: SPACING.sm, marginLeft: SPACING.sm },

  // Stepper
  stepper:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn:        { width: 32, height: 32, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgLight },
  stepBtnPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepMid:        { alignItems: 'center', minWidth: 30 },
  stepCount:      { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  stepUnit:       { fontSize: 9, color: COLORS.textGray, marginTop: -2 },

  // Bill
  billCard:    { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOW.sm, marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  billTitle:   { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.lg },
  billRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLabel:   { fontSize: FONTS.sizes.sm, color: COLORS.textMed },
  billValue:   { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textDark },
  billDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  totalLabel:  { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  totalSub:    { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  totalValue:  { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.extrabold, color: COLORS.primary },

  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginTop: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  noteTxt: { flex: 1, fontSize: FONTS.sizes.xs, color: COLORS.primary, lineHeight: 18 },

  // Footer
  footerBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: SPACING.lg,
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOW.lg,
  },
  footerInfo:  { flex: 1 },
  footerLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5 },
  footerValue: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark, marginTop: 2 },
  placeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl, paddingVertical: 14,
    ...SHADOW.md, shadowColor: COLORS.primary,
  },
  placeBtnTxt: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold },

  // Empty
  emptyWrap:    { alignItems: 'center', paddingHorizontal: SPACING.xxxl },
  emptyIconWrap:{ width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  emptyTitle:   { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  emptySub:     { fontSize: FONTS.sizes.sm, color: COLORS.textGray, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  shopBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 14, borderRadius: RADIUS.xl, marginTop: SPACING.xl, ...SHADOW.sm },
  shopBtnTxt:   { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },
});

export default CartScreen;
