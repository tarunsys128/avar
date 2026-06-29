import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, ScrollView, Alert, Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const MASTER_ACCOUNTS = []; // Removed to avoid linting errors if accidentally referenced

const LoginScreen = () => {
  const [isLogin, setIsLogin]     = useState(true);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMaster, setShowMaster] = useState(false);

  const { loginWithEmail, signupWithEmail, mockLogin } = useAuth();

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
        if (!name) { setErrorMessage('Please enter your name.'); setLoading(false); return; }
        const { error } = await signupWithEmail(email, password, name, phone);
        if (error) throw error;
        Alert.alert('Welcome!', 'Account created successfully.');
      }
    } catch (e) {
      setErrorMessage(e.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

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
          {/* ─── Brand ─────────────── */}
          <View style={s.brand}>
            <Image 
              source={require('../../../assets/images/icon.png')} 
              style={s.logoImage} 
              resizeMode="contain"
            />
          </View>

          {/* ─── Card ──────────────── */}
          <View style={s.card}>
            {/* Tab switcher */}
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
                <Text style={[s.tabTxt, !isLogin && s.tabTxtActive]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Name & Phone (sign-up only) */}
            {!isLogin && (
              <>
                <InputField
                  icon="👤"
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                />
                <InputField
                  icon="📱"
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <InputField
              icon="📧"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <InputField
              icon="🔒"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              rightAction={
                <TouchableOpacity onPress={() => setShowPwd(p => !p)} style={s.eyeBtn}>
                  <Text style={s.eyeEmoji}>{showPwd ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              }
            />

            {isLogin && (
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: SPACING.sm }}>
                <Text style={s.forgotTxt}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {errorMessage ? (
              <Text style={s.errorTxt}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity style={s.primaryBtn} onPress={handleAuth} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.primaryBtnTxt}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
              }
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const InputField = ({ icon, rightAction, ...props }) => (
  <View style={s.inputWrap}>
    <Text style={s.inputIcon}>{icon}</Text>
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

  // Brand
  brand: { alignItems: 'center', marginBottom: 24, elevation: 0, shadowOpacity: 0 },
  logoImage: { width: 120, height: 120, marginBottom: 0, borderRadius: 0, borderWidth: 0 },
  title: { fontSize: 36, fontWeight: '900', color: COLORS.primary, letterSpacing: 1.5 },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4, fontWeight: '500' },

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

  // Inputs
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52, marginBottom: SPACING.md,
  },
  inputIcon: { fontSize: 18, marginRight: SPACING.sm },
  input: { flex: 1, fontSize: FONTS.sizes.base, color: COLORS.textDark },
  eyeBtn: { padding: 4 },
  eyeEmoji: { fontSize: 18 },

  forgotTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.primary },
  errorTxt: { fontSize: FONTS.sizes.sm, color: COLORS.danger, textAlign: 'center', marginBottom: SPACING.md, fontWeight: FONTS.weights.medium },

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

  // Master
  masterSection: { marginTop: 24 },
  masterToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.md,
    ...SHADOW.sm,
  },
  masterToggleTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textMed },
  chevron: { color: COLORS.textGray, fontSize: 12 },
  masterPanel: { marginTop: 10 },
  masterHint: { textAlign: 'center', color: COLORS.textGray, fontSize: FONTS.sizes.xs, marginBottom: 8 },
  masterCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    ...SHADOW.sm,
  },
  masterEmoji: { fontSize: 24, marginRight: SPACING.md },
  masterLabel: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  masterRole: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  masterArrow: { fontSize: 20, fontWeight: FONTS.weights.bold },
});

export default LoginScreen;
