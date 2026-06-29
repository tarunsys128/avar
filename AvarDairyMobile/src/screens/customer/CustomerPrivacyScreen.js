import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const CustomerPrivacyScreen = ({ navigation }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Your password has been updated securely.');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        
        <View style={s.card}>
          <Text style={s.sectionTitle}>Change Password</Text>
          <Text style={s.desc}>Update your password to keep your account secure.</Text>
          
          <TextInput
            style={s.input}
            placeholder="New Password (min 6 chars)"
            placeholderTextColor={COLORS.textLight}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity 
            style={[s.btn, password.length < 6 && s.btnDisabled]} 
            onPress={handleUpdatePassword}
            disabled={password.length < 6 || loading}
          >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.btnTxt}>Update Password</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Data Privacy</Text>
          <View style={s.infoRow}>
            <Text style={s.infoEmoji}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>Your data is safe</Text>
              <Text style={s.infoDesc}>We use industry-standard encryption to protect your personal information and delivery addresses.</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoEmoji}>🚫</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.infoTitle}>No Third-Party Sharing</Text>
              <Text style={s.infoDesc}>Avar Dairy does not sell your order history or contact details to outside advertisers.</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  scroll: { padding: SPACING.lg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 38, alignItems: 'flex-start' },
  backArrow: { fontSize: 22, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm,
  },
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: 4 },
  desc: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginBottom: SPACING.lg },
  
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: FONTS.sizes.sm, color: COLORS.textDark,
    backgroundColor: COLORS.bgLight, marginBottom: SPACING.md,
  },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: SPACING.md },
  infoEmoji: { fontSize: 24, marginRight: SPACING.md },
  infoTitle: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: 2 },
  infoDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, lineHeight: 18 },
});

export default CustomerPrivacyScreen;
