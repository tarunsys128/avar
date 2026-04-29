import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Download, TrendingUp, Package, Users } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

// Note: Excel export on Native requires specialized libraries like expo-file-system or react-native-fs
// combined with sheetjs. We will mock the action here for the UI structure.

const AdminDashboardScreen = () => {
  const { logout } = useAuth();
  const totalRevenue = 1450;
  const totalOrders = 12;

  const handleExport = () => {
    Alert.alert("Export Initiated", "Generating AvarDairy_Orders.xlsx...");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>System Overview</Text>
        </View>
        <TouchableOpacity onPress={logout}><Text style={{color: 'red'}}>Logout</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
        <Download color="#fff" size={20} />
        <Text style={styles.exportBtnText}>Export Orders (Excel)</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
            <TrendingUp color="#16A34A" size={24} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>₹{totalRevenue}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
            <Package color="#2563EB" size={24} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statValue}>{totalOrders}</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
            <Users color="#9333EA" size={24} />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.statLabel}>Active Staff</Text>
            <Text style={styles.statValue}>3</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtnSecondary}>
            <Text style={styles.actionBtnTextDark}>Manage Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnSecondary}>
            <Text style={styles.actionBtnTextDark}>Manage Staff</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4F46E5', padding: 14, borderRadius: 8, marginBottom: 20 },
  exportBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statsContainer: { gap: 12, marginBottom: 20 },
  statCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  actionsRow: { gap: 12 },
  actionBtnSecondary: { backgroundColor: '#F3F4F6', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  actionBtnTextDark: { color: '#374151', fontWeight: 'bold', fontSize: 16 }
});

export default AdminDashboardScreen;
