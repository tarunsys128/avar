import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const STATUS_COLOR = {
  Delivered: COLORS.green,
  'Out for Delivery': COLORS.orange,
  Ready: COLORS.green,
  Preparing: COLORS.orange,
  Accepted: '#3B82F6',
  Pending: '#F59E0B',
  Cancelled: COLORS.danger,
};

const OrdersScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!currentUser?.id) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items (*, products (name, emoji))`)
      .eq('customer_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchOrders();
    const channelId = `orders-cust-${currentUser.id}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders', 
        filter: `customer_id=eq.${currentUser.id}` 
      }, () => fetchOrders())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Orders</Text>
        <Text style={s.headerSub}>View and track your recent purchases</Text>
      </View>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
      >
        {orders.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={40} color={COLORS.textLight} />
            </View>
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptyTxt}>Your wholesale orders will appear here once placed.</Text>
            <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
              <Text style={s.shopBtnTxt}>Place First Order</Text>
            </TouchableOpacity>
          </View>
        )}
        {orders.map(order => {
          const statusColor = STATUS_COLOR[order.status] || COLORS.textGray;
          const itemCount = order.order_items?.length || 0;
          const itemsPreview = order.order_items?.slice(0, 2).map(i => `${i.products?.name || 'Item'}`).join(', ') || '';

          return (
            <TouchableOpacity
              key={order.id}
              style={s.orderCard}
              onPress={() => navigation.navigate('OrderTracking', { orderId: order.id, placedOn: formatDate(order.created_at) })}
              activeOpacity={0.8}
            >
              <View style={s.orderTop}>
                <View style={s.orderIdCol}>
                  <Text style={s.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={s.orderDate}>{formatDate(order.created_at)} • {formatTime(order.created_at)}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[s.statusTxt, { color: statusColor }]}>{order.status}</Text>
                </View>
              </View>
              
              <View style={s.divider} />

              <View style={s.orderMiddle}>
                <View style={s.iconBox}>
                  <Ionicons name="cube" size={22} color={COLORS.primary} />
                </View>
                <View style={s.itemsInfo}>
                   {itemsPreview ? <Text style={s.itemsPreview} numberOfLines={1}>{itemsPreview}{itemCount > 2 ? ` +${itemCount - 2} more` : ''}</Text> : null}
                   <Text style={s.orderItems}>{itemCount} carton{itemCount !== 1 ? 's' : ''} · {itemCount * 5} kg</Text>
                </View>
                <Text style={s.orderTotal}>₹{order.total_amount}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgLight },
  
  header: { 
    backgroundColor: COLORS.white, 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  headerTitle: { fontSize: 24, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4 },
  
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOW.sm, marginBottom: SPACING.lg },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.sm },
  emptyTxt: { color: COLORS.textGray, fontSize: FONTS.sizes.base, textAlign: 'center', paddingHorizontal: SPACING.xl },
  shopBtn: { marginTop: SPACING.xl, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.full },
  shopBtnTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },

  orderCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.lg, 
    marginBottom: SPACING.md, 
    ...SHADOW.sm 
  },
  
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderIdCol: { flex: 1 },
  orderId: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  orderDate: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusTxt: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  
  orderMiddle: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  iconEmoji: { fontSize: 20 },
  itemsInfo: { flex: 1, paddingRight: SPACING.sm },
  itemsPreview: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium, color: COLORS.textDark },
  orderItems: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  
  orderTotal: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.primary },
});

export default OrdersScreen;
