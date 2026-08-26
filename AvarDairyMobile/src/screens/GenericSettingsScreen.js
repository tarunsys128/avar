import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const GenericSettingsScreen = ({ route, navigation }) => {
  const title = route.params?.title || 'Settings';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={s.content}>
        {title === 'Support Helpdesk' ? (
          <>
            <Text style={s.icon}>🎧</Text>
            <Text style={s.title}>Support Helpdesk</Text>
            <Text style={s.desc}>If you need assistance, please contact the admin team.</Text>
            
            <View style={s.contactCard}>
              <View style={s.contactRow}>
                <Text style={s.contactLabel}>Phone:</Text>
                <Text style={s.contactValue}>+91 99999 00000</Text>
              </View>
              <View style={s.contactRow}>
                <Text style={s.contactLabel}>Email:</Text>
                <Text style={s.contactValue}>support@avardairy.com</Text>
              </View>
            </View>

            <TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}>
              <Text style={s.btnTxt}>Go Back</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.icon}>🛠️</Text>
            <Text style={s.title}>{title}</Text>
            <Text style={s.desc}>This feature is currently under development and will be available in a future update.</Text>
            
            <TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}>
              <Text style={s.btnTxt}>Go Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 20, color: COLORS.textDark, marginTop: -2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  icon: { fontSize: 64, marginBottom: SPACING.md },
  title: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.sm, textAlign: 'center' },
  desc: { fontSize: FONTS.sizes.base, color: COLORS.textGray, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  
  btn: { backgroundColor: COLORS.yellow, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 100 },
  btnTxt: { color: COLORS.textDark, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },

  contactCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  contactLabel: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textGray,
    fontWeight: FONTS.weights.medium,
  },
  contactValue: {
    fontSize: FONTS.sizes.base,
    color: COLORS.textDark,
    fontWeight: FONTS.weights.bold,
  },
});

export default GenericSettingsScreen;
