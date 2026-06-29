import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const AdminProfileScreen = ({ navigation }) => {
  const { currentUser, logout } = useAuth();
  const name = currentUser?.name || 'Admin User';
  const email = currentUser?.email || 'admin@avardairy.com';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>System Admin</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarEmoji}>👑</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.email}>{email}</Text>
            <View style={s.roleBadge}>
              <Text style={s.roleTxt}>Administrator</Text>
            </View>
          </View>
        </View>

        {/* Settings Links */}
        <Text style={s.sectionTitle}>System Management</Text>
        <View style={s.menuGroup}>
          <MenuRow icon="⚙️" title="General Settings" onPress={() => navigation.navigate('AdminSettings')} />
          <MenuRow icon="📈" title="Analytics & Reports" onPress={() => navigation.navigate('AdminAnalytics')} />
        </View>

        <Text style={s.sectionTitle}>Access Control</Text>
        <View style={s.menuGroup}>
          <MenuRow icon="🔐" title="Change Password" onPress={() => navigation.navigate('AdminChangePassword')} />
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
    padding: SPACING.lg, marginBottom: SPACING.xl, ...SHADOW.sm, alignItems: 'center'
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.yellowLight,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md
  },
  avatarEmoji: { fontSize: 32 },
  profileInfo: { flex: 1 },
  name:  { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  email: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 2 },
  roleBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: 8 },
  roleTxt: { color: '#9333EA', fontSize: 10, fontWeight: FONTS.weights.bold },

  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textGray, marginBottom: SPACING.sm, marginLeft: 4 },
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

export default AdminProfileScreen;
