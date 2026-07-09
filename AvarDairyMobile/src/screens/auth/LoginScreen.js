import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, ScrollView, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const appVariant = Constants.expoConfig?.extra?.variant || 'customer';

const LoginScreen = () => {
  // For the management app, we show a role picker first
  const [selectedRole, setSelectedRole] = useState(appVariant === 'admin' ? null : 'customer'); // null = show picker
  const [isLogin, setIsLogin]     = useState(true);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { loginWithEmail, signupWithEmail, resetPassword } = useAuth();

  const handleAuth = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await loginWithEmail(email, password);
        if (error) throw error;
      } else {
        // Staff signup flow
        if (!name) { setErrorMessage('Please enter your name.'); setLoading(false); return; }
        
        // 1. Create auth account with proper role
        const role = isAdminApp ? 'staff' : 'customer';
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              name: name,
              phone: phone || '',
              role: role
            }
          }
        });
        
        if (error) throw error;
        
        // Profile creation and alerts are now handled by AuthContext.js via onAuthStateChange
        setLoading(false);
        setIsLogin(true); // reset to login view for after approval
        return;
      }
    } catch (e) {
      setErrorMessage(e.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage('');
    if (!email) {
      setErrorMessage('Please enter your email address to reset password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      Alert.alert('Reset Email Sent', `A password reset link has been sent to ${email}. Check your inbox.`);
    } catch (e) {
      setErrorMessage(e.message || 'Failed to send reset password email.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Management App: Role Selector Screen ────────────────────────────
  if (appVariant === 'admin' && selectedRole === null) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.rolePickerContainer}>
          <Image 
            source={require('../../../assets/images/icon.png')} 
            style={s.rolePickerLogo} 
            resizeMode="contain"
          />
          <Text style={s.rolePickerTitle}>Avar Management</Text>
          <Text style={s.rolePickerSub}>Select your role to continue</Text>

          <TouchableOpacity 
            style={s.roleCard} 
            onPress={() => { setSelectedRole('admin'); setIsLogin(true); }}
            activeOpacity={0.7}
          >
            <View style={[s.roleIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="shield-checkmark" size={32} color="#7C3AED" />
            </View>
            <View style={s.roleCardInfo}>
              <Text style={s.roleCardTitle}>Login as Admin</Text>
              <Text style={s.roleCardDesc}>Full access to all management tools, staff control, analytics & notifications.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textGray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.roleCard} 
            onPress={() => { setSelectedRole('staff'); setIsLogin(true); }}
            activeOpacity={0.7}
          >
            <View style={[s.roleIconBox, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="bicycle" size={32} color="#059669" />
            </View>
            <View style={s.roleCardInfo}>
              <Text style={s.roleCardTitle}>Login as Staff</Text>
              <Text style={s.roleCardDesc}>Delivery tasks, order management & your work dashboard.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={COLORS.textGray} />
          </TouchableOpacity>

          <View style={s.roleFooter}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textGray} />
            <Text style={s.roleFooterTxt}>Staff members can also create a new account from the next screen.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Auth Form (Login / Signup) ──────────────────────────────────────
  const isAdminApp = appVariant === 'admin';
  const isStaffRole = selectedRole === 'staff';
  const showSignupTab = isAdminApp ? isStaffRole : true; // Only staff can sign up in management app

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button for management app */}
          {isAdminApp && (
            <TouchableOpacity style={s.backToRoles} onPress={() => { setSelectedRole(null); setErrorMessage(''); }}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
              <Text style={s.backToRolesTxt}>Change Role</Text>
            </TouchableOpacity>
          )}

          {/* ─── Brand ─────────────── */}
          <View style={s.brand}>
            <Image 
              source={require('../../../assets/images/icon.png')} 
              style={s.logoImage} 
              resizeMode="contain"
            />
            {isAdminApp && (
              <View style={s.roleBadge}>
                <Ionicons 
                  name={isStaffRole ? 'bicycle' : 'shield-checkmark'} 
                  size={14} 
                  color={isStaffRole ? '#059669' : '#7C3AED'} 
                />
                <Text style={[s.roleBadgeTxt, { color: isStaffRole ? '#059669' : '#7C3AED' }]}>
                  {isStaffRole ? 'Staff Login' : 'Admin Login'}
                </Text>
              </View>
            )}
          </View>

          {/* ─── Card ──────────────── */}
          <View style={s.card}>
            {/* Tab switcher */}
            {showSignupTab ? (
              <View style={s.tabs}>
                <TouchableOpacity
                  style={[s.tab, isLogin && s.tabActive]}
                  onPress={() => setIsLogin(true)}
                >
                  <Text style={[s.tabTxt, isLogin && s.tabTxtActive]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tab, !isLogin && s.tabActive]}
                  onPress={() => setIsLogin(false)}
                >
                  <Text style={[s.tabTxt, !isLogin && s.tabTxtActive]}>
                    {isAdminApp ? 'Staff Sign Up' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.adminOnlyHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#7C3AED" />
                <Text style={s.adminOnlyTxt}>Admin Login Only</Text>
              </View>
            )}

            {/* Name & Phone (sign-up only) */}
            {!isLogin && (
              <>
                <InputField
                  iconName="person-outline"
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                />
                <InputField
                  iconName="call-outline"
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <InputField
              iconName="mail-outline"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <InputField
              iconName="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              rightAction={
                <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={s.eyeBtn}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textGray} />
                </TouchableOpacity>
              }
            />

            {isLogin && (
              <TouchableOpacity 
                style={{ alignSelf: 'flex-end', marginBottom: SPACING.sm }} 
                onPress={handleResetPassword}
              >
                <Text style={s.forgotTxt}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {errorMessage ? (
              <Text style={s.errorTxt}>{errorMessage}</Text>
            ) : null}

            {/* Info banner for staff signup */}
            {!isLogin && isAdminApp && (
              <View style={s.infoBanner}>
                <Ionicons name="time-outline" size={18} color="#B45309" />
                <Text style={s.infoBannerTxt}>After signup, your account needs Admin approval before you can login.</Text>
              </View>
            )}

            <TouchableOpacity style={s.primaryBtn} onPress={handleAuth} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnTxt}>{isLogin ? 'Sign In' : (isAdminApp ? 'Create Staff Account' : 'Create Account')}</Text>
              }
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const InputField = ({ iconName, rightAction, ...props }) => (
  <View style={s.inputWrap}>
    <Ionicons name={iconName} size={18} color={COLORS.textGray} style={{marginRight: SPACING.sm}} />
    <TextInput
      style={s.input}
      placeholderTextColor={COLORS.textGray}
      {...props}
    />
    {rightAction}
  </View>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl, paddingBottom: 40 },

  // Back to roles
  backToRoles: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  backToRolesTxt: { fontSize: FONTS.sizes.sm, color: COLORS.textDark, fontWeight: FONTS.weights.semibold, marginLeft: 6 },

  // Brand
  brand: { alignItems: 'center', marginBottom: 24 },
  logoImage: { width: 100, height: 100, borderRadius: 0 },
  roleBadge: { 
    flexDirection: 'row', alignItems: 'center', 
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, 
    borderRadius: RADIUS.full, backgroundColor: COLORS.white, 
    ...SHADOW.sm 
  },
  roleBadgeTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, marginLeft: 6 },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    ...SHADOW.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgLight,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary, ...SHADOW.sm },
  tabTxt: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.semibold, color: COLORS.textGray },
  tabTxtActive: { color: COLORS.white },

  adminOnlyHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F3FF', borderRadius: RADIUS.md, 
    padding: SPACING.md, marginBottom: SPACING.xl 
  },
  adminOnlyTxt: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: '#7C3AED', marginLeft: 8 },

  // Inputs
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52, marginBottom: SPACING.md,
  },
  input: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textDark },
  eyeBtn: { padding: 4 },

  forgotTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.primary },
  errorTxt: { fontSize: FONTS.sizes.sm, color: COLORS.danger, textAlign: 'center', marginBottom: SPACING.md, fontWeight: FONTS.weights.medium },

  // Info banner
  infoBanner: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', 
    padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md 
  },
  infoBannerTxt: { flex: 1, fontSize: FONTS.sizes.xs, color: '#92400E', marginLeft: 8, lineHeight: 18 },

  // Primary button
  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 52, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 4,
    ...SHADOW.md,
    shadowColor: COLORS.primary,
  },
  primaryBtnTxt: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },

  // ─── Role Picker (Management App) ────────────────────────────────────
  rolePickerContainer: { 
    flex: 1, justifyContent: 'center', padding: SPACING.xl
  },
  rolePickerLogo: { width: 90, height: 90, alignSelf: 'center', marginBottom: SPACING.lg },
  rolePickerTitle: { 
    fontSize: 28, fontWeight: '900', color: COLORS.textDark, 
    textAlign: 'center', letterSpacing: 0.5 
  },
  rolePickerSub: { 
    fontSize: FONTS.sizes.sm, color: COLORS.textGray, 
    textAlign: 'center', marginTop: 6, marginBottom: SPACING.xxl 
  },

  roleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  roleIconBox: {
    width: 56, height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.md,
  },
  roleCardInfo: { flex: 1, marginRight: 8 },
  roleCardTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  roleCardDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4, lineHeight: 17 },

  roleFooter: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.xl, paddingHorizontal: SPACING.lg 
  },
  roleFooterTxt: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginLeft: 6, flex: 1 },
});

export default LoginScreen;
