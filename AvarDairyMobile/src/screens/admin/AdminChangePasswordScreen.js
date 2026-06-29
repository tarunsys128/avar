import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { supabase } from '../../supabase';

const AdminChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // Note: Supabase auth.updateUser only requires the new password.
    // If the project requires reauthentication (secure email change / password change), 
    // it depends on the Supabase project configuration.
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Password updated successfully.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Change Password</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <Text style={s.label}>New Password</Text>
          <TextInput 
            style={s.input} 
            value={newPassword} 
            onChangeText={setNewPassword} 
            placeholder="Enter new password" 
            secureTextEntry 
          />

          <Text style={s.label}>Confirm New Password</Text>
          <TextInput 
            style={s.input} 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            placeholder="Confirm new password" 
            secureTextEntry 
          />

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading}>
             {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.saveBtnTxt}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 38, alignItems: 'flex-start' },
  backArrow:   { fontSize: 22, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOW.sm, padding: SPACING.lg },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textDark, fontWeight: FONTS.weights.medium, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.base, marginBottom: SPACING.lg, backgroundColor: '#FAFAFA' },

  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  saveBtnTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },
});

export default AdminChangePasswordScreen;
