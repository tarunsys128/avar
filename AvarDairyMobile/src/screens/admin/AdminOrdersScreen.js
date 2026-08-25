import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { sendLocalNotification, notifyCustomerOrderStatus, notifyAvailableStaff } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { Image } from 'expo-image';

const STATUS_COLOR = {
  Delivered: COLORS.green,
  Accepted:  '#3B82F6',
  Pending:   '#F59E0B',
  Cancelled: COLORS.danger,
};

// Simplified 2-step flow: Pending → Accepted → Delivered
const STATUS_FLOW = {
  Pending:  'Accepted',
  Accepted: 'Delivered',
};

const AdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [notifying, setNotifying] = useState({}); // tracks which orders are being notified
  const knownOrderIds = useRef(new Set());

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, profiles:customer_id (name, phone, email, avatar_url, business_name), order_items(*, products(name))`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      data.forEach(order => {
        if (order.status === 'Pending' && !knownOrderIds.current.has(order.id)) {
          if (knownOrderIds.current.size > 0) {
            sendLocalNotification({
              title: 'New Order Received!',
              body: `${order.profiles?.name || 'Customer'} placed an order of ₹${order.total_amount}`,
              data: { orderId: order.id },
            });
          }
          knownOrderIds.current.add(order.id);
        }
      });
      setOrders(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();

    // Real-time subscription — auto-refresh on any order change
    const channel = supabase
      .channel(`admin-orders-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ─── Update order status with OPTIMISTIC update ──────────────────────────────
  const updateOrderStatus = (order, newStatus) => {
    Alert.alert(
      'Update Order',
      `Change status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            // OPTIMISTIC: update local state immediately (no refresh needed)
            setOrders(prev =>
              prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o)
            );

            const { error } = await supabase
              .from('orders')
              .update({ status: newStatus, updated_at: new Date().toISOString() })
              .eq('id', order.id);

            if (error) {
              // Revert on failure
              setOrders(prev =>
                prev.map(o => o.id === order.id ? { ...o, status: order.status } : o)
              );
              Alert.alert('Error', error.message);
              return;
            }

            // Notify the customer
            await notifyCustomerOrderStatus({
              customerId: order.customer_id,
              orderId: order.id,
              newStatus,
            });
          }
        }
      ]
    );
  };

  // ─── Cancel order ─────────────────────────────────────────────────────────────
  const cancelOrder = (order) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          // Optimistic
          setOrders(prev =>
            prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o)
          );
          await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', order.id);
          await notifyCustomerOrderStatus({
            customerId: order.customer_id,
            orderId: order.id,
            newStatus: 'Cancelled',
          });
        }
      }
    ]);
  };

  // ─── Notify available staff for a specific order ──────────────────────────────
  const handleNotifyStaff = async (order) => {
    const orderId = order.id;
    setNotifying(prev => ({ ...prev, [orderId]: true }));

    const result = await notifyAvailableStaff({
      orderId,
      message: `Order #${orderId.slice(-6).toUpperCase()} needs attention! ₹${order.total_amount} — ${order.profiles?.name || 'Customer'}`,
    });

    setNotifying(prev => ({ ...prev, [orderId]: false }));

    if (result.sent > 0) {
      Alert.alert('Staff Notified', `Push notification sent to ${result.sent} staff member${result.sent > 1 ? 's' : ''} on duty.`);
    } else {
      Alert.alert('No Staff Available', 'No staff members are currently on duty or have push notifications enabled.');
    }
  };

  const filteredOrders = orders.filter(o =>
    activeTab === 'All' ? true : o.status === activeTab
  );

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Management</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Simplified tabs — only meaningful statuses */}
      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {['All', 'Pending', 'Accepted', 'Delivered', 'Cancelled'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>{tab}</Text>
              {(tab === 'Pending' || tab === 'Accepted') && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeTxt}>
                    {orders.filter(o => o.status === tab).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
      >
        {filteredOrders.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="clipboard-outline" size={64} color={COLORS.textGray} style={{ marginBottom: SPACING.md }} />
            <Text style={s.emptyTitle}>No Orders Found</Text>
            <Text style={s.emptyTxt}>
              There are no {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}orders at the moment.
            </Text>
          </View>
        )}

        {filteredOrders.map(order => {
          const nextStatus   = STATUS_FLOW[order.status];
          const statusColor  = STATUS_COLOR[order.status] || COLORS.textGray;
          const isNotifying  = notifying[order.id];

          return (
            <View key={order.id} style={s.orderCard}>
              <View style={s.orderHeader}>
                <View style={s.orderIdCol}>
                  <Text style={s.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={s.orderDate}>{formatDate(order.created_at)} at {formatTime(order.created_at)}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusColor + '18' }]}>
                  <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[s.statusTxt, { color: statusColor }]}>{order.status}</Text>
                </View>
              </View>

              <View style={s.divider} />

              {/* Order Items UI */}
              {order.order_items && order.order_items.length > 0 ? (
                <View style={s.itemsSection}>
                  <Text style={s.sectionHeaderSmall}>Items Ordered</Text>
                  {order.order_items.map(item => {
                    const boxSize = (item.weight_kg && item.blocks) ? (item.weight_kg / item.blocks) : 5;
                    const productName = item.products?.name || 'Product';
                    return (
                      <View key={item.id} style={s.itemRow}>
                        <Text style={s.itemDot}>•</Text>
                        <Text style={s.itemNameText}>{productName} ({boxSize}kg Box)</Text>
                        <Text style={s.itemQtyText}>x {item.blocks}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <View style={s.customerSection}>
                <View style={s.customerRow}>
                  {order.profiles?.avatar_url ? (
                    <Image source={{ uri: order.profiles.avatar_url }} style={s.customerAvatar} />
                  ) : (
                    <View style={s.avatarPh}><Ionicons name="business" size={14} color={COLORS.textGray} /></View>
                  )}
                  <Text style={s.customerName}>{order.profiles?.business_name || order.profiles?.name || 'Walk-in Customer'}</Text>
                </View>
                
                {order.profiles?.business_name && (
                   <View style={s.customerMetaRow}>
                     <Ionicons name="person-outline" size={14} color={COLORS.textGray} style={s.customerIcon} />
                     <Text style={s.customerText}>{order.profiles.name}</Text>
                   </View>
                )}
                
                {order.profiles?.phone && (
                  <View style={s.customerMetaRow}>
                    <Ionicons name="call-outline" size={14} color={COLORS.textGray} style={s.customerIcon} />
                    <Text style={s.customerText}>{order.profiles.phone}</Text>
                  </View>
                )}
                <View style={s.customerMetaRow}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textGray} style={s.customerIcon} />
                  <Text style={s.customerText} numberOfLines={2}>{order.delivery_address || 'Pickup'}</Text>
                </View>
              </View>

              <View style={s.orderFooter}>
                <View>
                  <Text style={s.totalLabel}>Total Amount</Text>
                  <Text style={s.orderTotal}>₹{order.total_amount}</Text>
                </View>
                <View style={s.actionGroup}>
                  {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <TouchableOpacity style={s.cancelBtn} onPress={() => cancelOrder(order)}>
                      <Text style={s.cancelBtnTxt}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  {nextStatus && (
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: STATUS_COLOR[nextStatus] || COLORS.primary }]}
                      onPress={() => updateOrderStatus(order, nextStatus)}
                    >
                      <Text style={s.actionBtnTxt}>
                        {nextStatus === 'Accepted' ? 'Accept Order' : 'Mark Delivered'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Notify Staff button — show for Pending & Accepted orders */}
              {(order.status === 'Pending' || order.status === 'Accepted') && (
                <TouchableOpacity
                  style={s.notifyStaffBtn}
                  onPress={() => handleNotifyStaff(order)}
                  disabled={isNotifying}
                >
                  {isNotifying ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <>
                      <Ionicons name="notifications-outline" size={16} color={COLORS.primary} />
                      <Text style={s.notifyStaffTxt}>Notify Staff on Duty</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 38, alignItems: 'flex-start' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  tabsWrapper: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabsRow:     { flexDirection: 'row', padding: SPACING.md, gap: 8, paddingRight: SPACING.lg },
  tabBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.bgLight, gap: 6 },
  tabBtnActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabTxt:         { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textGray },
  tabTxtActive:   { color: COLORS.white },
  tabBadge:       { backgroundColor: '#F59E0B', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeTxt:    { fontSize: 10, fontWeight: '800', color: '#fff' },

  scroll: { padding: SPACING.lg, paddingBottom: 100 },

  empty:      { alignItems: 'center', marginTop: 60, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: 4 },
  emptyTxt:   { color: COLORS.textGray, textAlign: 'center', fontSize: FONTS.sizes.base },

  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.md, borderWidth: 1, borderColor: COLORS.border },

  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderIdCol:  { flex: 1 },
  orderId:     { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  orderDate:   { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full },
  statusDot:   { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusTxt:   { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  itemsSection: { backgroundColor: '#F8FAFC', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  sectionHeaderSmall: { fontSize: 11, fontWeight: 'bold', color: COLORS.textMed, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  itemDot: { color: COLORS.primary, fontSize: 16, lineHeight: 18, marginRight: 6 },
  itemNameText: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textDark, fontWeight: '600' },
  itemQtyText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: 'bold', marginLeft: 8 },

  customerSection: { backgroundColor: '#FAFAFA', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  customerRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  customerMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  customerAvatar:  { width: 24, height: 24, borderRadius: 12, marginRight: 8, backgroundColor: COLORS.border },
  avatarPh:        { width: 28, height: 28, borderRadius: 6, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  customerIcon:    { marginRight: 8, width: 16 },
  customerName:    { fontSize: FONTS.sizes.md, fontWeight: '900', color: COLORS.textDark, flex: 1 },
  customerText:    { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textMed, fontWeight: '600' },

  orderFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:   { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginBottom: 2 },
  orderTotal:   { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },

  actionGroup:    { flexDirection: 'row', gap: SPACING.sm },
  actionBtn:      { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full, ...SHADOW.sm },
  actionBtnTxt:   { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.white },
  cancelBtn:      { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: '#FEF2F2' },
  cancelBtnTxt:   { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.danger },

  notifyStaffBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: SPACING.md,
    paddingVertical: 10, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  notifyStaffTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.primary },
});

export default AdminOrdersScreen;
