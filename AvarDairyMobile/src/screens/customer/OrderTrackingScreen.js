import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

// ─── Order status → timeline step mapping ─────────────────────────────────────
const STATUS_STEPS = [
  { key: 'Pending',   label: 'Order Placed',      desc: 'Your order has been received',       emoji: '🛒' },
  { key: 'Accepted',  label: 'Order Accepted',     desc: 'Your order has been confirmed',      emoji: '✅' },
  { key: 'Preparing', label: 'Being Prepared',     desc: 'Your fresh dairy products are being packed', emoji: '👨‍🍳' },
  { key: 'Ready',     label: 'Ready for Delivery', desc: 'Order is packed and ready',          emoji: '📦' },
  { key: 'Delivered', label: 'Delivered',          desc: 'Enjoy your fresh dairy products!',   emoji: '🏠' },
];

const STATUS_ORDER = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Delivered'];

const STATUS_COLOR = {
  Pending:   '#F59E0B',
  Accepted:  '#3B82F6',
  Preparing: '#F97316',
  Ready:     COLORS.green,
  Delivered: COLORS.green,
  Cancelled: COLORS.danger,
};

const OrderTrackingScreen = ({ navigation, route }) => {
  const orderId = route?.params?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!orderId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:customer_id (name, phone),
        order_items (*, products (name, emoji))
      `)
      .eq('id', orderId)
      .single();

    if (!error && data) setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();

    // Real-time subscription for this specific order
    const channel = supabase
      .channel(`order-track-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder(prev => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [orderId]);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Order Tracking</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
          <Text style={s.emptyTitle}>Order not found</Text>
          <Text style={s.emptyTxt}>We couldn't load this order. Please try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCancelled = order.status === 'Cancelled';
  const currentStatusIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Tracking</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Order Info Card */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <View>
              <Text style={s.infoLabel}>Order ID</Text>
              <Text style={s.infoValue}>#{order.id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.infoLabel}>Placed On</Text>
              <Text style={s.infoValue}>{formatDate(order.created_at)}</Text>
              <Text style={[s.infoLabel, { marginTop: 2 }]}>{formatTime(order.created_at)}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={[s.statusBadge, { backgroundColor: (STATUS_COLOR[order.status] || COLORS.textGray) + '18' }]}>
            <View style={[s.statusDot, { backgroundColor: STATUS_COLOR[order.status] || COLORS.textGray }]} />
            <Text style={[s.statusTxt, { color: STATUS_COLOR[order.status] || COLORS.textGray }]}>
              {order.status}
            </Text>
          </View>
        </View>

        {/* Cancelled Banner */}
        {isCancelled && (
          <View style={s.cancelBanner}>
            <Text style={s.cancelBannerText}>❌ This order has been cancelled.</Text>
          </View>
        )}

        {/* Delivery Card */}
        {!isCancelled && (
          <View style={s.deliveryCard}>
            <Text style={s.deliveryLabel}>Delivery Address</Text>
            <Text style={s.deliveryAddr}>{order.delivery_address || 'No address specified'}</Text>
            <View style={s.illustration}>
              <Text style={{ fontSize: 60 }}>🛵</Text>
              <View style={s.roadDots}>
                {[0, 1, 2, 3, 4].map(i => <View key={i} style={s.roadDot} />)}
              </View>
              <Text style={{ fontSize: 44 }}>🏠</Text>
            </View>
          </View>
        )}

        {/* Live Timeline */}
        {!isCancelled && (
          <View style={s.timelineCard}>
            <Text style={s.timelineTitleTxt}>Order Progress</Text>
            {STATUS_STEPS.map((step, idx) => {
              const stepIdx = STATUS_ORDER.indexOf(step.key);
              const isDone = stepIdx <= currentStatusIdx;
              const isActive = stepIdx === currentStatusIdx;
              const isLast = idx === STATUS_STEPS.length - 1;
              const color = isDone ? (STATUS_COLOR[step.key] || COLORS.green) : COLORS.border;

              return (
                <View key={step.key} style={s.stepRow}>
                  <View style={s.stepLeft}>
                    <View style={[s.stepDot, {
                      backgroundColor: isDone ? color : COLORS.bgLight,
                      borderWidth: isActive ? 3 : 1,
                      borderColor: isDone ? color : COLORS.border,
                      transform: [{ scale: isActive ? 1.15 : 1 }],
                    }]}>
                      <Text style={[s.stepEmoji, { opacity: isDone ? 1 : 0.3 }]}>{step.emoji}</Text>
                    </View>
                    {!isLast && (
                      <View style={[s.stepLine, { backgroundColor: isDone && !isActive ? color : COLORS.border }]} />
                    )}
                  </View>
                  <View style={[s.stepContent, isLast && { paddingBottom: 0 }]}>
                    <View style={s.stepHeader}>
                      <Text style={[s.stepLabel, { color: isDone ? COLORS.textDark : COLORS.textLight, fontWeight: isActive ? '800' : '600' }]}>
                        {step.label}
                      </Text>
                      {isActive && (
                        <View style={[s.activePill, { backgroundColor: (STATUS_COLOR[step.key] || COLORS.green) + '20' }]}>
                          <Text style={[s.activePillTxt, { color: STATUS_COLOR[step.key] || COLORS.green }]}>Now</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[s.stepDesc, { color: isDone ? COLORS.textMed : COLORS.textLight }]}>
                      {step.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Order Items */}
        {order.order_items && order.order_items.length > 0 && (
          <View style={s.itemsCard}>
            <Text style={s.itemsTitle}>Items Ordered</Text>
            {order.order_items.map((item, idx) => (
              <View key={item.id || idx} style={[s.itemRow, idx > 0 && s.itemRowBorder]}>
                <Text style={s.itemEmoji}>{item.products?.emoji || '🧀'}</Text>
                <View style={s.itemInfo}>
                  <Text style={s.itemName}>{item.products?.name || 'Item'}</Text>
                  <Text style={s.itemQty}>Qty: {item.blocks || item.quantity || 1}</Text>
                </View>
                <Text style={s.itemPrice}>₹{item.total_price?.toFixed(2)}</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total Paid</Text>
              <Text style={s.totalValue}>₹{order.total_amount?.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: SPACING.lg },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 38, alignItems: 'flex-start' },
  backArrow:   { fontSize: 22, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  emptyTxt:   { color: COLORS.textGray, textAlign: 'center' },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  infoLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginBottom: 2 },
  infoValue: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full },
  statusDot:   { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTxt:   { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold },

  // Cancel Banner
  cancelBanner: { backgroundColor: '#FEF2F2', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#FECACA', alignItems: 'center' },
  cancelBannerText: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.danger },

  // Delivery Card
  deliveryCard: {
    backgroundColor: COLORS.greenLight, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  deliveryLabel: { fontSize: FONTS.sizes.xs, color: COLORS.green, fontWeight: FONTS.weights.semibold },
  deliveryAddr:  { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginTop: 4, marginBottom: SPACING.md },
  illustration:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  roadDots:      { flexDirection: 'row', gap: 5 },
  roadDot:       { width: 8, height: 4, borderRadius: 2, backgroundColor: COLORS.green, opacity: 0.5 },

  // Timeline
  timelineCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  timelineTitleTxt: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.lg },
  stepRow:    { flexDirection: 'row' },
  stepLeft:   { alignItems: 'center', marginRight: SPACING.md, width: 40 },
  stepDot:    {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  stepEmoji:  { fontSize: 18 },
  stepLine:   { width: 2, flex: 1, marginVertical: 4, minHeight: 24 },
  stepContent:{ flex: 1, paddingBottom: SPACING.xl },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stepLabel:  { fontSize: FONTS.sizes.base },
  stepDesc:   { fontSize: FONTS.sizes.sm },
  activePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full },
  activePillTxt: { fontSize: 10, fontWeight: '800' },

  // Items Card
  itemsCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm },
  itemsTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md },
  itemRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  itemEmoji:  { fontSize: 28, marginRight: SPACING.md },
  itemInfo:   { flex: 1 },
  itemName:   { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  itemQty:    { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  itemPrice:  { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  totalValue: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.green },
});

export default OrderTrackingScreen;
