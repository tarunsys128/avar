import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Bell, MapPin, User, Phone, LogOut } from 'lucide-react-native';

const ProfileScreen = () => {
  const { currentUser, logout } = useAuth();
  const [reminderEnabled, setReminderEnabled] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <User color="#4F46E5" size={32} />
          </View>
          <View>
            <Text style={styles.name}>{currentUser?.name || 'Customer User'}</Text>
            <View style={[styles.row, { gap: 4, marginTop: 4 }]}>
              <Phone color="#6B7280" size={14} />
              <Text style={styles.phone}>{currentUser?.phone || '+91 9876543210'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#4F46E5' }]}>
        <View style={[styles.row, { marginBottom: 12 }]}>
          <Bell color="#4F46E5" size={24} />
          <Text style={styles.sectionTitle}>Daily Order Reminder</Text>
        </View>
        <Text style={styles.desc}>Never forget to order your fresh paneer. Set a daily reminder and we'll notify you!</Text>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Enable Reminder (8:00 AM)</Text>
          <Switch 
            value={reminderEnabled} 
            onValueChange={setReminderEnabled} 
            trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
            thumbColor={reminderEnabled ? '#4F46E5' : '#F9FAFB'}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={[styles.row, { marginBottom: 12 }]}>
          <MapPin color="#4F46E5" size={24} />
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
        </View>
        <View style={styles.addressBox}>
          <Text style={styles.addressText}>123 Dairy Lane, Milk City</Text>
          <Text style={styles.defaultBadge}>Default</Text>
        </View>
        <View style={[styles.addressBox, { marginTop: 8 }]}>
          <Text style={styles.addressText}>456 Farm Road, Cow Town</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut color="#EF4444" size={20} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold' },
  phone: { fontSize: 14, color: '#6B7280' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  desc: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  label: { fontSize: 14, fontWeight: '600' },
  addressBox: { padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  addressText: { fontSize: 14, fontWeight: '500' },
  defaultBadge: { backgroundColor: '#E5E7EB', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, marginTop: 4 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12, marginTop: 8 },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileScreen;
