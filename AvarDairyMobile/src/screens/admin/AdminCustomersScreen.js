import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, 
  ActivityIndicator, RefreshControl, TextInput, Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const AdminCustomersScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [orderStats, setOrderStats] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  
  // Local state for confirmation to avoid Alert issues
  const [confirmingId, setConfirmingId] = useState(null); // { id, action: 'promote' | 'block' }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(profiles || []);

      const { data: counts, error: countErr } = await supabase
        .from('orders')
        .select('customer_id');

      if (!countErr && counts) {
        const stats = {};
        counts.forEach(o => {
          stats[o.customer_id] = (stats[o.customer_id] || 0) + 1;
        });
        setOrderStats(stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
    setConfirmingId(null);
  };

  const handleAction = async (customer, action) => {
    setActionLoading(true);
    let updates = {};
    if (action === 'promote') updates = { role: 'staff' };
    if (action === 'block') updates = { is_blocked: !customer.is_blocked };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', customer.id);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setConfirmingId(null);
        fetchData();
      }
    } catch (e) {
      Alert.alert('Error', 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search)
  );

  if (loading && customers.length === 0) {
    return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Customers</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search Bar */}
      <View style={s.searchContainer}>
        <View style={s.searchBox}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput 
            style={s.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredCustomers.map(cust => {
          const isExpanded = expandedId === cust.id;
          const totalOrders = orderStats[cust.id] || 0;
          const isConfirming = confirmingId?.id === cust.id;
          
          return (
            <View key={cust.id} style={[s.card, cust.is_blocked && s.cardBlocked]}>
              <Pressable style={s.cardHeader} onPress={() => toggleExpand(cust.id)}>
                <View style={[s.avatar, cust.is_blocked && { backgroundColor: '#FEE2E2' }]}>
                  <Text style={s.avatarTxt}>{cust.is_blocked ? '🚫' : '👤'}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.name}>{cust.name || 'Anonymous'}</Text>
                  <Text style={s.phone}>📞 {cust.phone || 'No phone'}</Text>
                </View>
                <View style={s.statsBox}>
                  <Text style={s.statNum}>{totalOrders}</Text>
                  <Text style={s.statLbl}>Orders</Text>
                </View>
              </Pressable>

              {isExpanded && (
                <View style={s.detailsBox}>
                  <View style={s.divider} />
                  
                  {isConfirming ? (
                    <View style={s.confirmBox}>
                      <Text style={s.confirmTxt}>
                        {confirmingId.action === 'promote' 
                          ? 'Promote to Staff member?' 
                          : cust.is_blocked ? 'Unblock this customer?' : 'Block this customer?'}
                      </Text>
                      <View style={s.confirmActions}>
                        <TouchableOpacity style={s.cancelMiniBtn} onPress={() => setConfirmingId(null)}>
                          <Text style={s.cancelMiniBtnTxt}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[s.confirmMiniBtn, { backgroundColor: confirmingId.action === 'block' && !cust.is_blocked ? COLORS.danger : COLORS.primary }]} 
                          onPress={() => handleAction(cust, confirmingId.action)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.confirmMiniBtnTxt}>Confirm</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Business Type</Text>
                        <Text style={s.detailValue}>{cust.business_type || 'Retail'}</Text>
                      </View>
                      <View style={s.detailRow}>
                        <Text style={s.detailLabel}>Member Since</Text>
                        <Text style={s.detailValue}>{new Date(cust.created_at).toLocaleDateString()}</Text>
                      </View>

                      <View style={s.actionsRow}>
                        <TouchableOpacity 
                          style={s.promoteBtn} 
                          onPress={() => setConfirmingId({ id: cust.id, action: 'promote' })}
                        >
                          <Text style={s.promoteBtnTxt}>Make Staff</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[s.blockBtn, { backgroundColor: cust.is_blocked ? COLORS.greenLight : COLORS.danger + '15' }]} 
                          onPress={() => setConfirmingId({ id: cust.id, action: 'block' })}
                        >
                          <Text style={[s.blockBtnTxt, { color: cust.is_blocked ? COLORS.green : COLORS.danger }]}>
                            {cust.is_blocked ? 'Unblock' : 'Block'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.md, backgroundColor: COLORS.white, 
    borderBottomWidth: 1, borderBottomColor: COLORS.border 
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 20, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  searchContainer: { padding: SPACING.lg, backgroundColor: COLORS.white },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, height: 44 },
  searchInput: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.textDark },
  scroll: { padding: SPACING.lg },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm },
  cardBlocked: { opacity: 0.8, borderColor: COLORS.danger + '30', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  avatarTxt: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  phone: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4 },
  statsBox: { alignItems: 'center', minWidth: 50 },
  statNum: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.primary },
  statLbl: { fontSize: 10, color: COLORS.textGray },
  detailsBox: { marginTop: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textGray },
  detailValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textDark },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.md },
  promoteBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  promoteBtnTxt: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.white },
  blockBtn: { flex: 1, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  blockBtnTxt: { fontSize: FONTS.sizes.sm, fontWeight: 'bold' },
  
  confirmBox: { backgroundColor: COLORS.bgLight, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  confirmTxt: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.textDark, marginBottom: SPACING.md },
  confirmActions: { flexDirection: 'row', gap: 10 },
  cancelMiniBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.sm, backgroundColor: '#E5E7EB' },
  cancelMiniBtnTxt: { color: COLORS.textDark, fontSize: 12, fontWeight: 'bold' },
  confirmMiniBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.sm },
  confirmMiniBtnTxt: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
});

export default AdminCustomersScreen;
