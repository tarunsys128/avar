import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const HelpSupportScreen = ({ navigation }) => {
  const CONTACT_1 = '7568666277';
  const CONTACT_2 = '6350234823';

  const handleCall = (num) => {
    Linking.openURL(`tel:+91${num}`);
  };

  const handleWhatsApp = (num) => {
    Linking.openURL(`whatsapp://send?phone=91${num}&text=Hello Avar Dairy, I need assistance with my order.`);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@avardairy.com');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Help & Support</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        {/* ── Contact Options ──────────── */}
        <View style={s.contactCard}>
          <Text style={s.contactTitle}>Need Assistance?</Text>
          <Text style={s.contactSub}>Our team is here to help you with your fresh dairy deliveries.</Text>
          
          <View style={s.supportOptions}>
            <TouchableOpacity style={s.supportBtn} onPress={() => handleCall(CONTACT_1)}>
              <View style={[s.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="call" size={20} color="#0284C7" />
              </View>
              <View style={s.supportInfo}>
                <Text style={s.supportLabel}>Primary Helpline</Text>
                <Text style={s.supportVal}>+91 {CONTACT_1}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.supportBtn} onPress={() => handleWhatsApp(CONTACT_1)}>
              <View style={[s.iconBox, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
              </View>
              <View style={s.supportInfo}>
                <Text style={s.supportLabel}>WhatsApp Support</Text>
                <Text style={s.supportVal}>Chat with us</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.supportBtn} onPress={handleEmail}>
              <View style={[s.iconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="mail" size={20} color="#475569" />
              </View>
              <View style={s.supportInfo}>
                <Text style={s.supportLabel}>Email Support</Text>
                <Text style={s.supportVal}>support@avardairy.com</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FAQs ──────────────────── */}
        <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
        
        <View style={s.faqItem}>
          <Text style={s.faqQ}>How do I track my order?</Text>
          <Text style={s.faqA}>Go to the 'Orders' tab to see your active deliveries and track them in real-time.</Text>
        </View>

        <View style={s.faqItem}>
          <Text style={s.faqQ}>What are the delivery hours?</Text>
          <Text style={s.faqA}>We deliver fresh milk and dairy products every morning between 6:00 AM and 10:00 AM.</Text>
        </View>

        {/* ── Business Info (From Image) ──── */}
        <View style={s.businessCard}>
          <Text style={s.bizName}>AVAR DAIRY PVT. LTD.</Text>
          <Text style={s.bizSub}>Dairy Products Manufacturer</Text>
          
          <View style={s.bizDivider} />
          
          <View style={s.bizRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.textGray} />
            <Text style={s.bizText}>Jodhpur Road, AHORE, Dist - Jalore (Raj.)</Text>
          </View>

          <View style={s.regRow}>
            <View style={s.regItem}>
              <Text style={s.regLabel}>CIN</Text>
              <Text style={s.regVal}>U15490RJ2019PTC064257</Text>
            </View>
            <View style={s.regItem}>
              <Text style={s.regLabel}>GSTIN</Text>
              <Text style={s.regVal}>08AASCA0325R1Z5</Text>
            </View>
            <View style={s.regItem}>
              <Text style={s.regLabel}>FSSAI</Text>
              <Text style={s.regVal}>12223029000041</Text>
            </View>
          </View>
        </View>

        <Text style={s.footerTxt}>App Version 1.2.0 (Stable)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  scroll: { padding: SPACING.lg, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 38, alignItems: 'flex-start' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  
  contactCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.xl, ...SHADOW.sm,
  },
  contactTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: 4 },
  contactSub: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginBottom: SPACING.xl },
  
  supportOptions: { gap: 16 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgLight, padding: 12, borderRadius: RADIUS.lg },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  supportInfo: { marginLeft: 12 },
  supportLabel: { fontSize: 10, color: COLORS.textGray, textTransform: 'uppercase', letterSpacing: 0.5 },
  supportVal: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md, marginTop: SPACING.md },
  faqItem: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, ...SHADOW.sm },
  faqQ: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: 4 },
  faqA: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, lineHeight: 18 },

  businessCard: {
    marginTop: SPACING.xl, padding: SPACING.xl,
    backgroundColor: '#F8FAFC', borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
  },
  bizName: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.extrabold, color: COLORS.textDark },
  bizSub: { fontSize: 10, color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  bizDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  bizRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bizText: { flex: 1, fontSize: 11, color: COLORS.textMed, lineHeight: 16 },
  
  regRow: { marginTop: 16, gap: 10 },
  regItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  regLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.textGray },
  regVal: { fontSize: 10, fontWeight: 'bold', color: COLORS.textDark },

  footerTxt: { textAlign: 'center', fontSize: 10, color: COLORS.textLight, marginTop: 32 },
});

export default HelpSupportScreen;
