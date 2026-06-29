import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { Image } from 'expo-image';

const StaffHistoryScreen = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, profiles:customer_id (name, phone, avatar_url)`)
      .in('status', ['Delivered', 'Cancelled'])
      .eq('staff_id', currentUser.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (!error && data) setOrders(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' · ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Delivery History</Text>
        <Text style={s.subtitle}>Last {orders.length} completed orders</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} />}
      >
        {orders.length === 0 && (
          <View style={s.empty}><Text style={s.emptyTxt}>No completed deliveries yet.</Text></View>
        )}
        {orders.map(order => (
          <View key={order.id} style={s.card}>
            <View style={s.cardTop}>
              <View>
                <Text style={s.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                <Text style={s.orderDate}>{formatDate(order.updated_at || order.created_at)}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: order.status === 'Delivered' ? COLORS.greenLight : '#FEE2E2' }]}>
                <Text style={[s.badgeTxt, { color: order.status === 'Delivered' ? COLORS.green : COLORS.danger }]}>
                  {order.status}
                </Text>
              </View>
            </View>
            <View style={s.customerSection}>
              <View style={s.customerInfoMain}>
                {order.profiles?.avatar_url ? (
                  <Image source={{ uri: order.profiles.avatar_url }} style={s.avatar} />
                ) : (
                  <View style={s.avatarPlaceholder}><Text style={{fontSize: 12}}>👤</Text></View>
                )}
                <View>
                  <Text style={s.customerName}>{order.profiles?.name || 'Customer'}</Text>
                  {order.profiles?.phone && <Text style={s.customerPhone}>📞 {order.profiles.phone}</Text>}
                </View>
              </View>
              <Text style={s.amount}>₹{order.total_amount}</Text>
            </View>
            <View style={s.locationSection}>
              <Text style={s.address}>📍 {order.delivery_address || 'No address'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: SPACING.lg, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4 },
  scroll: { padding: SPACING.lg, paddingBottom: 60 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyTxt: { color: COLORS.textGray, fontSize: FONTS.sizes.base },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderId: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  orderDate: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeTxt: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  customerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customerInfoMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgLight },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  customerPhone: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  amount: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.green },
  locationSection: { borderTopWidth: 1, borderTopColor: COLORS.bgLight, paddingTop: 10 },
  address: { fontSize: FONTS.sizes.xs, color: COLORS.textMed, lineHeight: 16 },
});

export default StaffHistoryScreen;
