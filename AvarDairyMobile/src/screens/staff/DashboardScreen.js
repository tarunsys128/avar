import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Linking, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { sendLocalNotification, notifyCustomerOrderStatus } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

const STATUS_FLOW = { Pending: 'Accepted', Accepted: 'Delivered' };
const STATUS_COLOR = { Pending: '#F59E0B', Accepted: '#3B82F6', Delivered: COLORS.textGray };

const StaffDashboardScreen = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending');
  const [isDutyOn, setIsDutyOn] = useState(true);
  const [stats, setStats] = useState({ today: 0, total: 0 });

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, profiles:customer_id (name, phone, avatar_url)`)
      .in('status', ['Pending', 'Accepted', 'Preparing', 'Ready'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const { count: todayCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('staff_id', currentUser.id)
      .eq('status', 'Delivered')
      .gte('updated_at', today.toISOString());

    setStats(prev => ({ ...prev, today: todayCount || 0 }));
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
    setIsDutyOn(currentUser.is_available ?? true);

    const channelId = `staff-ords-${currentUser.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
        fetchStats();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleDuty = async () => {
    const newVal = !isDutyOn;
    setIsDutyOn(newVal);
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: newVal })
      .eq('id', currentUser.id);
    
    if (error) {
      Alert.alert('Status Error', 'Failed to update availability');
      setIsDutyOn(!newVal);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone, orderId) => {
    if (!phone) return;
    const msg = `Hello! I am from Avar Dairy. I'm delivering your order #${orderId.slice(-6).toUpperCase()}.`;
    Linking.openURL(`whatsapp://send?phone=91${phone}&text=${encodeURIComponent(msg)}`);
  };

  const handleNavigate = (address) => {
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const updateStatus = async (order) => {
    const nextStatus = STATUS_FLOW[order.status] || 'Delivered';
    
    try {
      const updatePayload = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };

      if (!order.staff_id) {
        updatePayload.staff_id = currentUser.id;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (order.status === 'Pending') {
        setActiveTab('Active');
      }

      await notifyCustomerOrderStatus({
        customerId: order.customer_id,
        orderId: order.id,
        newStatus: nextStatus,
      });
    } catch (err) {
      console.error('Update Status Error:', err);
      Alert.alert('Error', err.message || 'Failed to update order status');
    }
  };

  const getButtonText = (status) => {
    if (status === 'Pending') return 'Accept & Start Delivery';
    if (['Accepted', 'Preparing', 'Ready'].includes(status)) return 'Mark as Delivered';
    return null;
  };

  const pendingOrders = orders.filter(o => 
    o.status === 'Pending' || (o.status === 'Accepted' && !o.staff_id)
  );
  const activeOrders  = orders.filter(o => 
    ['Accepted', 'Preparing', 'Ready'].includes(o.status) && 
    o.staff_id === currentUser.id
  );
  const displayList   = activeTab === 'Pending' ? pendingOrders : activeOrders;

  const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Avar Partner 🛵</Text>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: isDutyOn ? COLORS.green : COLORS.danger }]} />
            <Text style={s.subtitle}>{isDutyOn ? 'On Duty' : 'Off Duty'}</Text>
          </View>
        </View>
        <Switch
          value={isDutyOn}
          onValueChange={toggleDuty}
          trackColor={{ false: COLORS.border, true: COLORS.green + '80' }}
          thumbColor={isDutyOn ? COLORS.green : COLORS.textGray}
        />
      </View>

      <View style={s.statsBar}>
        <View style={s.statItem}>
          <Text style={s.statVal}>{stats.today}</Text>
          <Text style={s.statLab}>Today's Deliveries</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal}>Active</Text>
          <Text style={s.statLab}>{activeOrders.length} In Progress</Text>
        </View>
      </View>

      <View style={s.tabsRow}>
        <TouchableOpacity
          style={[s.tabBtn, activeTab === 'Pending' && s.tabBtnActive]}
          onPress={() => setActiveTab('Pending')}
        >
          <Text style={[s.tabTxt, activeTab === 'Pending' && s.tabTxtActive]}>
            New ({pendingOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, activeTab === 'Active' && s.tabBtnActive]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[s.tabTxt, activeTab === 'Active' && s.tabTxtActive]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
      >
        {displayList.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>No {activeTab.toLowerCase()} tasks right now.</Text>
          </View>
        )}

        {displayList.map(order => {
          const color   = STATUS_COLOR[order.status] || COLORS.textGray;
          const btnText = getButtonText(order.status);

          return (
            <View key={order.id} style={s.orderCard}>
              {order.status === 'Pending' && <View style={s.newIndicator} />}

              <View style={s.orderTop}>
                <View>
                  <Text style={s.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={s.orderTime}>⏱ {formatTime(order.created_at)}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[s.statusTxt, { color }]}>{order.status}</Text>
                </View>
              </View>

              <View style={s.customerBox}>
                <View style={s.customerRow}>
                  {order.profiles?.avatar_url ? (
                    <Image source={{ uri: order.profiles.avatar_url }} style={s.customerAvatar} />
                  ) : (
                    <View style={s.avatarPh}><Text style={{fontSize:10}}>👤</Text></View>
                  )}
                  <View>
                    <Text style={s.customerName}>{order.profiles?.name || 'Customer'}</Text>
                    {order.status !== 'Pending' && order.profiles?.phone && (
                      <Text style={s.customerPhone}>📞 {order.profiles.phone}</Text>
                    )}
                  </View>
                </View>
                
                <Text style={s.customerInfo}>📍 {order.delivery_address || 'No address provided'}</Text>
                <Text style={s.customerInfo}>💰 ₹{order.total_amount}</Text>
                
                {order.status !== 'Pending' && (
                  <View style={s.commActions}>
                    <TouchableOpacity style={s.commBtn} onPress={() => handleCall(order.profiles?.phone)}>
                      <Ionicons name="call" size={18} color={COLORS.primary} />
                      <Text style={s.commBtnTxt}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.commBtn} onPress={() => handleWhatsApp(order.profiles?.phone, order.id)}>
                      <Ionicons name="logo-whatsapp" size={18} color={COLORS.green} />
                      <Text style={s.commBtnTxt}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.commBtn} onPress={() => handleNavigate(order.delivery_address)}>
                      <Ionicons name="map" size={18} color={COLORS.orange} />
                      <Text style={s.commBtnTxt}>Map</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.notes ? (
                  <Text style={[s.customerInfo, { color: COLORS.orange, fontStyle: 'italic', marginTop: 8 }]}>
                    📝 {order.notes}
                  </Text>
                ) : null}
              </View>

              {btnText && isDutyOn && (
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={[s.primaryBtn, { backgroundColor: color }]}
                    onPress={() => updateStatus(order)}
                  >
                    <Text style={s.primaryBtnTxt}>{btnText}</Text>
                  </TouchableOpacity>
                </View>
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
    padding: SPACING.lg, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textGray },
  
  statsBar: { flexDirection: 'row', backgroundColor: COLORS.white, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.primary },
  statLab: { fontSize: 10, color: COLORS.textGray, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border, height: '60%' },

  tabsRow: { flexDirection: 'row', padding: SPACING.md, gap: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  tabBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textGray },
  tabTxtActive: { color: COLORS.white },

  scroll: { padding: SPACING.lg, paddingBottom: 60 },
  empty:  { alignItems: 'center', marginTop: 60 },
  emptyTxt: { color: COLORS.textGray, fontSize: FONTS.sizes.base, textAlign: 'center' },

  orderCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm, overflow: 'hidden' },
  newIndicator: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, backgroundColor: '#3B82F6' },

  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId:  { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  orderTime:{ fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusTxt:   { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },

  customerBox:  { backgroundColor: COLORS.bgLight, padding: 12, borderRadius: RADIUS.md, marginBottom: 16, gap: 2 },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  customerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border },
  avatarPh: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border, justifyContent:'center', alignItems:'center' },
  customerName: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  customerPhone: { fontSize: 11, color: COLORS.textMed },
  customerInfo: { fontSize: FONTS.sizes.sm, color: COLORS.textMed },
  
  commActions: { flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border + '50', paddingTop: 10 },
  commBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  commBtnTxt: { fontSize: 11, fontWeight: FONTS.weights.semibold, color: COLORS.textDark },

  actionRow:   { flexDirection: 'row', gap: 8 },
  primaryBtn:  { flex: 1, borderRadius: RADIUS.md, paddingVertical: 12, justifyContent: 'center', alignItems: 'center' },
  primaryBtnTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm },
});

export default StaffDashboardScreen;
