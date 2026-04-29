import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Clock, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const mockOrders = [
  {
    id: 'ORD-1001', customerName: 'Rahul Kumar', phone: '+919876543210', total: 1200, status: 'Pending', time: '10:30 AM',
    items: [{ name: 'Soft Paneer', weight: 5, blocks: 1 }], address: '123 Dairy Lane'
  },
  {
    id: 'ORD-1002', customerName: 'Priya Singh', phone: '+919876543211', total: 250, status: 'Preparing', time: '09:15 AM',
    items: [{ name: 'Malai Paneer', weight: 1, blocks: 1 }], address: '456 Farm Road'
  }
];

const StaffDashboardScreen = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [filter, setFilter] = useState('Today');
  const { logout } = useAuth();

  const updateStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const getNextStatus = (current) => {
    switch (current) {
      case 'Pending': return 'Accepted';
      case 'Accepted': return 'Preparing';
      case 'Preparing': return 'Ready';
      case 'Ready': return 'Delivered';
      default: return null;
    }
  };

  const stats = {
    pending: orders.filter(o => o.status === 'Pending').length,
    active: orders.filter(o => ['Accepted', 'Preparing', 'Ready'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'Delivered').length
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      
      <View style={styles.headerRow}>
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterBtn, filter === 'Today' && styles.filterBtnActive]} onPress={() => setFilter('Today')}>
            <Text style={[styles.filterText, filter === 'Today' && styles.filterTextActive]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterBtn, filter === 'All' && styles.filterBtnActive]} onPress={() => setFilter('All')}>
            <Text style={[styles.filterText, filter === 'All' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={logout}><Text style={{color: 'red'}}>Logout</Text></TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F97316' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {orders.map(order => {
        const nextStatus = getNextStatus(order.status);
        return (
          <View key={order.id} style={styles.card}>
            {order.status === 'Pending' && <View style={styles.pendingBar} />}
            
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>{order.id}</Text>
                <View style={styles.timeRow}>
                  <Clock color="#6B7280" size={14} />
                  <Text style={styles.timeText}>{order.time} • {order.customerName}</Text>
                </View>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>{order.status}</Text></View>
            </View>

            <View style={styles.detailsBox}>
              <Text style={{fontWeight: 'bold', marginBottom: 4}}>Order Details:</Text>
              {order.items.map((item, idx) => (
                <Text key={idx} style={{color: '#374151'}}>{item.blocks}x {item.name} ({item.weight}KG)</Text>
              ))}
            </View>

            <Text style={styles.infoText}><Text style={{fontWeight: 'bold'}}>Address:</Text> {order.address}</Text>
            <Text style={styles.infoText}><Text style={{fontWeight: 'bold'}}>Phone:</Text> {order.phone}</Text>

            <View style={styles.footerRow}>
              <View>
                <Text style={styles.totalLabel}>Total (COD)</Text>
                <Text style={styles.totalPrice}>₹{order.total}</Text>
              </View>
              {nextStatus && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(order.id, nextStatus)}>
                  <Text style={styles.actionBtnText}>Mark as {nextStatus}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB' },
  filterBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterText: { color: '#4B5563', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, overflow: 'hidden' },
  pendingBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#F97316' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 12, color: '#6B7280' },
  badge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { color: '#4F46E5', fontSize: 12, fontWeight: '600' },
  detailsBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  infoText: { fontSize: 14, color: '#374151', marginBottom: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { fontSize: 12, color: '#6B7280' },
  totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#4F46E5' },
  actionBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default StaffDashboardScreen;
