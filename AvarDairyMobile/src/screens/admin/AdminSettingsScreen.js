import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { supabase } from '../../supabase';

const AdminSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) {
      console.error(error);
    } else {
      const map = {};
      data?.forEach(item => {
        map[item.key] = item.value === 'true';
      });
      setSettings(map);
    }
    setLoading(false);
  };

  const toggleSetting = async (key, currentValue) => {
    const newValue = !currentValue;
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setSavingKey(key);

    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value: newValue.toString() }, { onConflict: 'key' });

    setSavingKey(null);

    if (error) {
      Alert.alert("Error", "Failed to save setting.");
      setSettings(prev => ({ ...prev, [key]: currentValue }));
    }
  };

  const getValue = (key, defaultVal = false) => {
    return settings[key] !== undefined ? settings[key] : defaultVal;
  };

  if (loading) {
     return <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>System Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={s.sectionTitle}>General Configurations</Text>
        <View style={s.card}>
          <SettingRow 
            title="Maintenance Mode" 
            desc="Disable customer app access for updates" 
            value={getValue('maintenance_mode')} 
            onToggle={() => toggleSetting('maintenance_mode', getValue('maintenance_mode'))}
            isLoading={savingKey === 'maintenance_mode'}
          />
          <View style={s.divider} />
          <SettingRow 
            title="Auto-Accept Orders" 
            desc="Skip pending state for new orders" 
            value={getValue('auto_accept_orders', true)} 
            onToggle={() => toggleSetting('auto_accept_orders', getValue('auto_accept_orders', true))}
            isLoading={savingKey === 'auto_accept_orders'}
          />
        </View>

        <Text style={s.sectionTitle}>Notifications</Text>
        <View style={s.card}>
          <SettingRow 
            title="Global Push Notifications" 
            desc="Enable or disable push notifications completely" 
            value={getValue('push_notifications', true)} 
            onToggle={() => toggleSetting('push_notifications', getValue('push_notifications', true))}
            isLoading={savingKey === 'push_notifications'}
          />
          <View style={s.divider} />
          <SettingRow 
            title="Order Status SMS" 
            desc="Send SMS to customers on order status changes" 
            value={getValue('sms_notifications')} 
            onToggle={() => toggleSetting('sms_notifications', getValue('sms_notifications'))}
            isLoading={savingKey === 'sms_notifications'}
          />
        </View>

        <Text style={s.sectionTitle}>Payment Gateway</Text>
        <View style={s.card}>
          <SettingRow 
            title="Enable Online Payments" 
            desc="Allow users to pay via UPI/Cards" 
            value={getValue('online_payments', true)} 
            onToggle={() => toggleSetting('online_payments', getValue('online_payments', true))}
            isLoading={savingKey === 'online_payments'}
          />
          <View style={s.divider} />
          <SettingRow 
            title="Cash on Delivery (COD)" 
            desc="Allow Cash on Delivery method" 
            value={getValue('cod_enabled', true)} 
            onToggle={() => toggleSetting('cod_enabled', getValue('cod_enabled', true))}
            isLoading={savingKey === 'cod_enabled'}
          />
        </View>
        
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingRow = ({ title, desc, value, onToggle, isLoading }) => (
  <View style={s.settingRow}>
    <View style={s.settingTextCol}>
      <Text style={s.settingTitle}>{title}</Text>
      <Text style={s.settingDesc}>{desc}</Text>
    </View>
    {isLoading ? (
      <ActivityIndicator size="small" color={COLORS.primary} style={{marginRight: 10}} />
    ) : (
      <Switch 
        value={value} 
        onValueChange={onToggle} 
        trackColor={{ false: COLORS.border, true: COLORS.greenLight }}
        thumbColor={value ? COLORS.green : COLORS.textGray}
      />
    )}
  </View>
);

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
  
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textGray, marginBottom: SPACING.sm, marginLeft: 4, marginTop: SPACING.md },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOW.sm, padding: SPACING.lg },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  settingTextCol: { flex: 1, paddingRight: SPACING.md },
  settingTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  settingDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  
  divider: { height: 1, backgroundColor: COLORS.bgLight, marginVertical: SPACING.sm }
});

export default AdminSettingsScreen;
