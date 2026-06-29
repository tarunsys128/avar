import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { useIsFocused } from '@react-navigation/native';
import { Image } from 'expo-image';

const StaffProfileScreen = ({ navigation }) => {
  const { currentUser, logout } = useAuth();
  const isFocused = useIsFocused();

  const name = currentUser?.name || 'Staff Member';
  const phone = currentUser?.phone || 'Not set';
  
  const [isAvailable, setIsAvailable] = useState(currentUser?.is_available ?? true);
  const [deliveriesToday, setDeliveriesToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id) return;

      // Ensure profile state is fetched correctly
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_available')
        .eq('id', currentUser.id)
        .single();
        
      if (profile) setIsAvailable(profile.is_available);

      // Fetch deliveries today (assuming completed/delivered orders are tracked)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // We use staff_id or just count all delivered if not assigned. 
      // Assuming staff_id was added but let's count all Delivered for now if unassigned.
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Delivered')
        .eq('staff_id', currentUser.id)
        .gte('updated_at', today.toISOString());

      setDeliveriesToday(count || 0);
      setLoading(false);
    };

    if (isFocused) {
      fetchData();
    }
  }, [isFocused, currentUser]);

  const handleToggle = async (val) => {
    setIsAvailable(val);
    const { error } = await supabase
      .from('profiles')
      .update({ is_available: val })
      .eq('id', currentUser.id);

    if (error) {
      setIsAvailable(!val);
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Delivery Profile</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={s.profileCard}>
          {currentUser?.avatar_url ? (
            <Image source={{ uri: currentUser.avatar_url }} style={s.avatarImg} />
          ) : (
            <View style={s.avatarPh}>
              <Text style={s.avatarEmoji}>🛵</Text>
            </View>
          )}
          <View style={s.profileInfo}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.phone}>{phone}</Text>
            <View style={s.ratingBox}>
              <Text style={s.star}>⭐</Text>
              <Text style={s.ratingTxt}>Avar Verified Partner</Text>
            </View>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={s.toggleCard}>
          <View>
            <Text style={s.toggleTitle}>Duty Status</Text>
            <Text style={s.toggleSub}>{isAvailable ? 'You are receiving new orders' : 'You are currently offline'}</Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleToggle}
            trackColor={{ false: COLORS.border, true: COLORS.greenLight }}
            thumbColor={isAvailable ? COLORS.green : COLORS.textGray}
          />
        </View>

        {/* Performance & Earnings */}
        <Text style={s.sectionTitle}>Performance Overview (Today)</Text>
        <View style={s.statsGrid}>
          <View style={s.statBox}>
            {loading ? <ActivityIndicator size="small" color={COLORS.green} /> : <Text style={s.statValue}>{deliveriesToday}</Text>}
            <Text style={s.statLabel}>Deliveries Today</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>100%</Text>
            <Text style={s.statLabel}>On-Time Rate</Text>
          </View>
        </View>

        {/* Settings Links */}
        <Text style={s.sectionTitle}>Account & Settings</Text>
        <View style={s.menuGroup}>
          <MenuRow icon="⏰" title="Task Reminders" onPress={() => navigation.navigate('Reminders')} />
          <MenuRow icon="🔒" title="Change Password" onPress={() => navigation.navigate('GenericSettings', { title: 'Change Password' })} />
          <MenuRow icon="🎧" title="Support Helpdesk" onPress={() => navigation.navigate('GenericSettings', { title: 'Support Helpdesk' })} />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutBtnTxt}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const MenuRow = ({ icon, title, onPress }) => (
  <TouchableOpacity style={s.menuRow} onPress={onPress}>
    <View style={s.menuIconBox}><Text>{icon}</Text></View>
    <Text style={s.menuTitle}>{title}</Text>
    <Text style={s.chevron}>›</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  header: { padding: SPACING.lg, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, textAlign: 'center' },

  scroll: { padding: SPACING.lg, paddingBottom: 60 },
  
  profileCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm, alignItems: 'center'
  },
  avatarImg: {
    width: 64, height: 64, borderRadius: 32, marginRight: SPACING.md, backgroundColor: COLORS.border
  },
  avatarPh: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.greenLight,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md
  },
  avatarEmoji: { fontSize: 32 },
  profileInfo: { flex: 1 },
  name:  { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  phone: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  star: { fontSize: 12, marginRight: 4 },
  ratingTxt: { fontSize: FONTS.sizes.xs, color: COLORS.textDark, fontWeight: FONTS.weights.medium },

  toggleCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.xl, ...SHADOW.sm, alignItems: 'center', justifyContent: 'space-between'
  },
  toggleTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  toggleSub: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },

  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textGray, marginBottom: SPACING.sm, marginLeft: 4 },
  
  statsGrid: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  statBox: {
    flex: 1, backgroundColor: COLORS.white, padding: SPACING.lg,
    borderRadius: RADIUS.lg, ...SHADOW.sm, alignItems: 'center'
  },
  statValue: { fontSize: 24, fontWeight: FONTS.weights.extrabold, color: COLORS.green },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4 },

  menuGroup: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, ...SHADOW.sm, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.bgLight
  },
  menuIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  menuTitle: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textDark, fontWeight: FONTS.weights.medium },
  chevron: { fontSize: 24, color: COLORS.textLight, marginTop: -4 },

  logoutBtn: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center',
    marginTop: SPACING.md
  },
  logoutBtnTxt: { color: COLORS.danger, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },
});

export default StaffProfileScreen;
