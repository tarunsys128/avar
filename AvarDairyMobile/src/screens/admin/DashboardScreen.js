import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const AdminDashboardScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  // Use actual name → fallback to email prefix → fallback to 'Admin'
  const name = currentUser?.name 
    || currentUser?.email?.split('@')[0] 
    || 'Admin';
  
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, pendingOrders: 0, activeStaff: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        .select(`
          *, 
          profiles:customer_id(name),
          staff:profiles!staff_id(name)
        `)
        .order('updated_at', { ascending: false })
        .limit(8);

      if (!ordersError && !staffError && !recentError) {
        setStats({
          revenue,
          totalOrders: ordersData?.length || 0,
          pendingOrders: pending,
          activeStaff: staffCount || 0
        });
        
        // 3a. Since we want staff metadata in recent activity, let's fetch staff names 
        // if they are linked, otherwise "Unknown Staff"
        const formattedActivity = (recentData || []).map(order => {
          let title = '';
          let icon = 'cube-outline';
          let iconColor = COLORS.textGray;
          
          // Try to fetch STAFF name directly via join
          const cName = order.profiles?.name || 'Customer';
          const sName = order.staff?.name || 'Staff';
          
          if (order.status === 'Pending') { 
            title = `New Order #${order.id.slice(-6).toUpperCase()} from ${cName}`; 
            icon = 'time-outline';
            iconColor = COLORS.orange;
          }
          else if (order.status === 'Accepted' || order.status === 'Preparing' || order.status === 'Ready') { 
            title = `${sName} ${order.status} Order #${order.id.slice(-6).toUpperCase()}`; 
            icon = 'bicycle-outline';
            iconColor = COLORS.primary;
          }
          else if (order.status === 'Delivered') { 
            title = `${sName} Delivered #${order.id.slice(-6).toUpperCase()}`; 
            icon = 'checkmark-circle-outline';
            iconColor = COLORS.green;
          }
          else if (order.status === 'Cancelled') { 
            title = `Order #${order.id.slice(-6).toUpperCase()} Cancelled`; 
            icon = 'close-circle-outline';
            iconColor = COLORS.danger;
          }
          else { 
            title = `Order #${order.id.slice(-6).toUpperCase()} is ${order.status}`; 
            icon = 'cube-outline';
            iconColor = COLORS.primary;
          }
          
          return { 
            id: order.id, icon, iconColor, title, 
            time: new Date(order.updated_at || order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
          };
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
    { label: 'Today\'s Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: 'trending-up', color: COLORS.green },
    { label: 'Today\'s Orders', value: stats.totalOrders.toString(), icon: 'cube', color: COLORS.yellow },
    { label: 'Active Staff', value: stats.activeStaff.toString(), icon: 'people', color: '#3B82F6' },
    { label: 'Pending Orders', value: stats.pendingOrders.toString(), icon: 'time', color: COLORS.orange },
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
        <View style={[s.header, { justifyContent: 'space-between', paddingHorizontal: 0, marginBottom: SPACING.xl }]}>
          <View style={s.headerLeft}>
            <Text style={s.greeting}>Hello, {name}</Text>
            <Text style={s.subGreeting}>Here's what's happening today</Text>
          </View>
          <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <Text style={s.sectionTitle}>Overview (Today)</Text>
        <View style={s.statsGrid}>
          {STATS_UI.map((stat, idx) => (
            <View key={idx} style={s.statCard}>
              <View style={[s.iconBox, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
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
            <View style={[s.actionIcon, { backgroundColor: '#F3E8FF' }]}><Ionicons name="people" size={24} color="#9333EA" /></View>
            <Text style={s.actionTxt}>Manage Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBox} onPress={() => navigation.navigate('AdminProds')}>
            <View style={[s.actionIcon, { backgroundColor: COLORS.yellowLight }]}><Ionicons name="cube" size={24} color={COLORS.yellow} /></View>
            <Text style={s.actionTxt}>Edit Catalog</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBox} onPress={() => navigation.navigate('AdminOrds')}>
            <View style={[s.actionIcon, { backgroundColor: COLORS.greenLight }]}><Ionicons name="list" size={24} color={COLORS.green} /></View>
            <Text style={s.actionTxt}>All Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBox} onPress={() => navigation.navigate('AdminAnalytics')}>
            <View style={[s.actionIcon, { backgroundColor: '#FFEDD5' }]}><Ionicons name="stats-chart" size={24} color="#EA580C" /></View>
            <Text style={s.actionTxt}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBox} onPress={() => navigation.navigate('AdminNotifications')}>
            <View style={[s.actionIcon, { backgroundColor: '#E0F2FE' }]}><Ionicons name="notifications" size={24} color="#0284C7" /></View>
            <Text style={s.actionTxt}>Notify Users</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Mock */}
        <Text style={s.sectionTitle}>Recent Activity</Text>
        <View style={s.activityCard}>
          {recentActivity.length === 0 ? (
             <Text style={{color: COLORS.textGray, textAlign: 'center', padding: SPACING.md}}>No recent activity.</Text>
          ) : (
             recentActivity.map((activity, idx) => (
               <ActivityRow key={activity.id + idx} icon={activity.icon} iconColor={activity.iconColor} title={activity.title} time={activity.time} />
             ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ActivityRow = ({ icon, iconColor, title, time }) => (
  <View style={s.activityRow}>
    <View style={[s.activityIcon, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={s.activityInfo}>
      <Text style={s.activityTitle} numberOfLines={1}>{title}</Text>
      <Text style={s.activityTime}>{time}</Text>
    </View>
  </View>
);

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  scroll: { padding: SPACING.lg },

  header: { 
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg,
    flexDirection: 'row', alignItems: 'center'
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textDark },
  subGreeting: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4 },
  bellBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },

  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.md, marginBottom: SPACING.xl },
  statCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, ...SHADOW.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  statValue: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.textDark },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4, fontWeight: '600' },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xl, justifyContent: 'space-between' },
  actionBox: { width: '47%', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.xl, alignItems: 'center', ...SHADOW.sm, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.bgLight },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  actionTxt: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textDark, textAlign: 'center' },

  activityCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOW.md, borderWidth: 1, borderColor: COLORS.border },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  activityIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textDark },
  activityTime: { fontSize: 11, color: COLORS.textGray, marginTop: 4, fontWeight: '600' },
});

export default AdminDashboardScreen;
