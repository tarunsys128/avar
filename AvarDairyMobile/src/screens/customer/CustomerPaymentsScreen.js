import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const CustomerPaymentsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment Methods</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.sectionTitle}>Preferred Payment</Text>
        
        <View style={[s.card, s.cardActive]}>
          <View style={s.radioCircle}>
            <View style={s.radioDot} />
          </View>
          <View style={s.cardInfo}>
            <Text style={s.cardTitle}>💵 Cash on Delivery (COD)</Text>
            <Text style={s.cardSub}>Pay when you receive your order.</Text>
          </View>
        </View>

        <Text style={[s.sectionTitle, { marginTop: SPACING.xl }]}>Other Options</Text>

        <View style={s.card}>
          <View style={s.radioCircle} />
          <View style={s.cardInfo}>
            <Text style={s.cardTitle}>📱 UPI Apps</Text>
            <Text style={s.cardSub}>Google Pay, PhonePe, Paytm</Text>
            <View style={s.comingSoonBadge}><Text style={s.comingSoonTxt}>Coming Soon</Text></View>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.radioCircle} />
          <View style={s.cardInfo}>
            <Text style={s.cardTitle}>💳 Credit / Debit Cards</Text>
            <Text style={s.cardSub}>Visa, Mastercard, RuPay</Text>
            <View style={s.comingSoonBadge}><Text style={s.comingSoonTxt}>Coming Soon</Text></View>
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
  
  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md },

  card: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'flex-start', ...SHADOW.sm,
  },
  cardActive: {
    borderColor: COLORS.green, backgroundColor: COLORS.greenLight + '20',
  },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, marginTop: 2,
  },
  cardActiveCircle: { borderColor: COLORS.green },
  radioDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.green,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  cardSub: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 4 },
  
  comingSoonBadge: {
    backgroundColor: COLORS.bgLight, paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: RADIUS.sm, alignSelf: 'flex-start', marginTop: 8,
  },
  comingSoonTxt: { fontSize: 10, color: COLORS.textMed, fontWeight: FONTS.weights.bold, textTransform: 'uppercase' },
});

export default CustomerPaymentsScreen;
