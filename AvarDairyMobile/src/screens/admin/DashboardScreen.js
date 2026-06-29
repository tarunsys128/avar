import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { sendLocalNotification } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const AdminDashboardScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const name = currentUser?.name || 'Admin';
  
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, pendingOrders: 0, activeStaff: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const knownOrderIds = React.useRef(new Set());

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Today's Orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString());

      let revenue = 0;
      let pending = 0;
      if (!ordersError && ordersData) {
        ordersData.forEach(o => {
          if (o.status !== 'Cancelled') revenue += (o.total_amount || 0);
          if (o.status === 'Pending') {
             pending++;
             if (!knownOrderIds.current.has(o.id)) {
               if (knownOrderIds.current.size > 0) {
                 sendLocalNotification({
                   title: '🛒 New Order Received!',
                   body: `A new order of \u20b9${o.total_amount} was placed.`,
                   data: { orderId: o.id },
                 });
               }
               knownOrderIds.current.add(o.id);
             }
          }
        });
      }

      // 2. Fetch Active Staff count
      const { count: staffCount, error: staffError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'staff')
        .eq('is_available', true);

      // 3. Fetch Recent Activity
      const { data: recentData, error: recentError } = await supabase
        .from('orders')
        .select('*, profiles:customer_id(name)')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!ordersError && !staffError && !recentError) {
        setStats({
          revenue,
          totalOrders: ordersData?.length || 0,
          pendingOrders: pending,
          activeStaff: staffCount || 0
        });
        
        const formattedActivity = (recentData || []).map(order => {
          let title = '';
          let icon = '📦';
          if (order.status === 'Pending') { title = `New Order #${order.id.slice(-4).toUpperCase()} from ${order.profiles?.name || 'Customer'}`; icon = '📦'; }
          else if (order.status === 'Delivered') { title = `Order #${order.id.slice(-4).toUpperCase()} Delivered`; icon = '✅'; }
          else if (order.status === 'Cancelled') { title = `Order #${order.id.slice(-4).toUpperCase()} Cancelled`; icon = '❌'; }
          else { title = `Order #${order.id.slice(-4).toUpperCase()} is ${order.status}`; icon = '🛵'; }
          
          return { id: order.id, icon, title, time: new Date(order.updated_at || order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
        });
        setRecentActivity(formattedActivity);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Real-time subscriptions for Orders and Profiles
    const ordersChannel = supabase
      .channel(`dashboard-orders-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchDashboardData)
      .subscribe();

    const profilesChannel = supabase
      .channel(`dashboard-profiles-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const STATS_UI = [
    { label: 'Today\'s Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, emoji: '📈', color: COLORS.green },
    { label: 'Today\'s Orders', value: stats.totalOrders.toString(), emoji: '📦', color: COLORS.yellow },
    { label: 'Active Staff', value: stats.activeStaff.toString(), emoji: '👨', color: '#3B82F6' },
    { label: 'Pending Orders', value: stats.pendingOrders.toString(), emoji: '⏳', color: COLORS.orange },
  ];

  if (loading) {
    return <View style={[s.safe, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView 
        contentContainerStyle={s.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hello, {name} 👋</Text>
            <Text style={s.subtitle}>Here is your system overview.</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={s.sectionTitle}>Overview (Today)</Text>
        <View style={s.statsGrid}>
          {STATS_UI.map((stat, idx) => (
            <View key={idx} style={s.statCard}>
              <View style={[s.iconBox, { backgroundColor: stat.color + '20' }]}>
                <Text style={s.statEmoji}>{stat.emoji}</Text>
              </View>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionGrid}>
          <TouchableOpacity style={s.actionBox} onPress={() => navigation.navigate('AdminCustomers')}>
            <View style={[s.actionIcon, { backgroundColor: '#F3E8FF' }]}><Text style={{fontSize: 20}}>👥</Text></View>
            <Text style={s.actionTxt}>Manage Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBox} onPress={() => navigation.navigate('AdminProds')}>
            <View style={[s.actionIcon, { backgroundColor: COLORS.yellowLight }]}><Text style={{fontSize: 20}}>🧀</Text></View>
            <Text style={s.actionTxt}>Edit Catalog</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBox} onPress={() => navigation.navigate('AdminOrds')}>
            <View style={[s.actionIcon, { backgroundColor: COLORS.greenLight }]}><Text style={{fontSize: 20}}>📋</Text></View>
            <Text style={s.actionTxt}>All Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBox} onPress={() => navigation.navigate('AdminAnalytics')}>
            <View style={[s.actionIcon, { backgroundColor: '#FFEDD5' }]}><Text style={{fontSize: 20}}>📈</Text></View>
            <Text style={s.actionTxt}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Mock */}
        <Text style={s.sectionTitle}>Recent Activity</Text>
        <View style={s.activityCard}>
          {recentActivity.length === 0 ? (
             <Text style={{color: COLORS.textGray, textAlign: 'center', padding: SPACING.md}}>No recent activity.</Text>
          ) : (
             recentActivity.map((activity, idx) => (
               <ActivityRow key={activity.id + idx} icon={activity.icon} title={activity.title} time={activity.time} />
             ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ActivityRow = ({ icon, title, time }) => (
  <View style={s.activityRow}>
    <View style={s.activityIcon}><Text>{icon}</Text></View>
    <View style={s.activityInfo}>
      <Text style={s.activityTitle}>{title}</Text>
      <Text style={s.activityTime}>{time}</Text>
    </View>
  </View>
);

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  scroll: { padding: SPACING.lg },

  header: { marginBottom: SPACING.xl },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4 },

  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, ...SHADOW.sm, marginBottom: SPACING.sm
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl, justifyContent: 'space-between' },
  actionBox: { width: '47%', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center', ...SHADOW.sm, marginBottom: SPACING.sm },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  actionTxt: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold, color: COLORS.textDark, textAlign: 'center' },

  activityCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  activityTime: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
});

export default AdminDashboardScreen;
