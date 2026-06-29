import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { useIsFocused } from '@react-navigation/native';
import { Image } from 'expo-image';

const MENU_ITEMS = [
  { emoji: '📦', label: 'My Orders',      key: 'orders' },
  { emoji: '📍', label: 'Saved Addresses', key: 'address' },
  { emoji: '💳', label: 'Payment Methods', key: 'payment' },
  { emoji: '🔔', label: 'Notifications',  key: 'notifs' },
  { emoji: '🔒', label: 'Privacy & Security', key: 'privacy' },
  { emoji: '📞', label: 'Help & Support', key: 'help' },
  { emoji: '⏰', label: 'Order Reminders', key: 'reminders' },
  { emoji: '⭐', label: 'Rate the App',   key: 'rate' },
];

const ProfileScreen = ({ navigation }) => {
  const { currentUser, logout } = useAuth();
  const isFocused = useIsFocused();
  
  const [stats, setStats] = useState({ ordersCount: 0, totalSpent: 0, addressCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.id) return;
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('customer_id', currentUser.id);

      let spent = 0;
      let count = 0;
      if (ordersData) {
        ordersData.forEach(o => {
          if (o.status !== 'Cancelled') {
            spent += (o.total_amount || 0);
            count++;
          }
        });
      }

      const { count: addrCount } = await supabase
        .from('addresses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      setStats({ ordersCount: count, totalSpent: spent, addressCount: addrCount || 0 });
      setLoadingStats(false);
    };

    if (isFocused) {
      fetchStats();
    }
  }, [isFocused, currentUser]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const name  = currentUser?.name || currentUser?.displayName || 'Customer';
  const email = currentUser?.email || 'Not set';
  const phone = currentUser?.phone || 'Not set';

  const handleMenuPress = (key, label) => {
    switch (key) {
      case 'orders':
        navigation.navigate('Orders');
        break;
      case 'address':
        navigation.navigate('CustomerAddresses');
        break;
      case 'payment':
        navigation.navigate('CustomerPayments');
        break;
      case 'notifs':
        navigation.navigate('CustomerNotifications');
        break;
      case 'privacy':
        navigation.navigate('CustomerPrivacy');
        break;
      case 'help':
        navigation.navigate('HelpSupport');
        break;
      case 'reminders':
        navigation.navigate('Reminders');
        break;
      case 'rate':
        Alert.alert('Thank You!', 'App rating will be available in the Play Store soon.');
        break;
      default:
        navigation.navigate('GenericSettings', { title: label });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <View style={s.avatarCard}>
          <View style={s.avatarContainer}>
            {currentUser?.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarEmoji}>👤</Text>
              </View>
            )}
          </View>
          <Text style={s.userName}>{name}</Text>
          <Text style={s.userEmail}>{email}</Text>
          {phone !== 'Not set' && <Text style={s.userPhone}>📱 {phone}</Text>}
          
          {currentUser?.business_name && (
            <View style={s.businessBadge}>
              <Text style={s.businessTxt}>{currentUser.business_name}</Text>
            </View>
          )}

          <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('EditCustomerProfile')}>
            <Text style={s.editBtnTxt}>Edit Profile & Business Info</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            {loadingStats ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={s.statValue}>{stats.ordersCount}</Text>}
            <Text style={s.statLabel}>Orders</Text>
          </View>
          <View style={[s.statCard, s.statDivider]}>
            {loadingStats ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={s.statValue}>{stats.addressCount}</Text>}
            <Text style={s.statLabel}>Addresses</Text>
          </View>
          <View style={s.statCard}>
            {loadingStats ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={s.statValue}>₹{stats.totalSpent.toLocaleString('en-IN')}</Text>}
            <Text style={s.statLabel}>Spent</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={s.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              style={[s.menuRow, idx < MENU_ITEMS.length - 1 && s.menuDivider]}
              onPress={() => handleMenuPress(item.key, item.label)}
            >
              <Text style={s.menuEmoji}>{item.emoji}</Text>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutTxt}>🚪  Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },

  header: {
    backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  avatarCard: {
    backgroundColor: COLORS.white, margin: SPACING.lg,
    borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', ...SHADOW.sm,
  },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight, overflow: 'hidden',
    marginBottom: SPACING.md, borderWidth: 3, borderColor: COLORS.primary,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 40 },
  userName:  { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  userEmail: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4 },
  userPhone: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 2 },
  businessBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginTop: 8 },
  businessTxt: { color: '#9333EA', fontSize: 10, fontWeight: FONTS.weights.bold },

  editBtn: {
    marginTop: SPACING.md, paddingHorizontal: 24, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  editBtnTxt: { color: COLORS.primary, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm },

  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg, borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg, ...SHADOW.sm, overflow: 'hidden',
  },
  statCard:    { flex: 1, paddingVertical: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border },
  statValue:   { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.extrabold, color: COLORS.primary },
  statLabel:   { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },

  menuCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl, ...SHADOW.sm, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md + 2,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuEmoji:   { fontSize: 20, marginRight: SPACING.md },
  menuLabel:   { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textDark },
  menuArrow:   { fontSize: 20, color: COLORS.textGray },

  logoutBtn: {
    margin: SPACING.lg, backgroundColor: '#FFF0F0',
    borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center',
    borderWidth: 1, borderColor: '#FFD0D0',
  },
  logoutTxt: { color: COLORS.danger, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },
});

export default ProfileScreen;
