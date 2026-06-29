import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { sendLocalNotification, notifyCustomerOrderStatus } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { Image } from 'expo-image';

const STATUS_COLOR = {
  Delivered: COLORS.green,
  Ready: COLORS.green,
  'Out for Delivery': COLORS.orange,
  Preparing: COLORS.orange,
  Accepted: '#3B82F6',
  Pending: '#F59E0B',
  Cancelled: COLORS.danger,
};

const STATUS_FLOW = {
  Pending: 'Accepted',
  Accepted: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Delivered',
};

const AdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const knownOrderIds = useRef(new Set());

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:customer_id (name, phone, email, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Detect new Pending orders and push local notification
      data.forEach(order => {
        if (order.status === 'Pending' && !knownOrderIds.current.has(order.id)) {
          if (knownOrderIds.current.size > 0) {
            sendLocalNotification({
              title: '🛒 New Order Received!',
              body: `${order.profiles?.name || 'Customer'} placed an order of \u20b9${order.total_amount}`,
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

    // Real-time subscription
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const updateOrderStatus = async (order, newStatus) => {
    Alert.alert('Update Order', `Change status to "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          const { error } = await supabase
            .from('orders')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', order.id);
          if (error) {
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
    ]);
  };

  const cancelOrder = async (order) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', order.id);
          // Notify the customer
          await notifyCustomerOrderStatus({
            customerId: order.customer_id,
            orderId: order.id,
            newStatus: 'Cancelled',
          });
        }
      }
    ]);
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
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Management</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {['All', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>{tab}</Text>
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
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTitle}>No Orders Found</Text>
            <Text style={s.emptyTxt}>There are no {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}orders at the moment.</Text>
          </View>
        )}

        {filteredOrders.map(order => {
          const nextStatus = STATUS_FLOW[order.status];
          const statusColor = STATUS_COLOR[order.status] || COLORS.textGray;
          
          return (
            <View key={order.id} style={s.orderCard}>
              <View style={s.orderHeader}>
                <View style={s.orderIdCol}>
                  <Text style={s.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={s.orderDate}>{formatDate(order.created_at)} at {formatTime(order.created_at)}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[s.statusTxt, { color: statusColor }]}>{order.status}</Text>
                </View>
              </View>

              <View style={s.divider} />

              <View style={s.customerSection}>
                <View style={s.customerRow}>
                  {order.profiles?.avatar_url ? (
                    <Image source={{ uri: order.profiles.avatar_url }} style={s.customerAvatar} />
                  ) : (
                    <Text style={s.customerIcon}>👤</Text>
                  )}
                  <Text style={s.customerName}>{order.profiles?.name || 'Walk-in Customer'}</Text>
                </View>
                {order.profiles?.phone && (
                   <View style={s.customerRow}>
                     <Text style={s.customerIcon}>📞</Text>
                     <Text style={s.customerText}>{order.profiles.phone}</Text>
                   </View>
                )}
                <View style={s.customerRow}>
                  <Text style={s.customerIcon}>📍</Text>
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
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: STATUS_COLOR[nextStatus] || COLORS.primary }]} onPress={() => updateOrderStatus(order, nextStatus)}>
                      <Text style={s.actionBtnTxt}>Mark {nextStatus}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
  },
  backBtn: { width: 38, alignItems: 'flex-start' },
  backArrow: { fontSize: 22, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  
  tabsWrapper: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabsRow: { flexDirection: 'row', padding: SPACING.md, gap: 8, paddingRight: SPACING.lg },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.bgLight },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textGray },
  tabTxtActive: { color: COLORS.white },
  
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: SPACING.xl },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: 4 },
  emptyTxt: { color: COLORS.textGray, textAlign: 'center', fontSize: FONTS.sizes.base },
  
  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm },
  
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderIdCol: { flex: 1 },
  orderId: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  orderDate: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusTxt: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  
  customerSection: { backgroundColor: '#FAFAFA', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  customerAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8, backgroundColor: COLORS.border },
  customerIcon: { fontSize: 14, marginRight: 8, width: 20, textAlign: 'center' },
  customerName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  customerText: { flex: 1, fontSize: FONTS.sizes.xs, color: COLORS.textMed },
  
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginBottom: 2 },
  orderTotal: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },
  
  actionGroup: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full, ...SHADOW.sm },
  actionBtnTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.white },
  
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: '#FEF2F2' },
  cancelBtnTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.danger },
});

export default AdminOrdersScreen;
