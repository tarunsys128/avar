import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { supabase } from '../../supabase';
import { exportToExcel } from '../../services/exportService';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const AdminAnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState('Today'); // Today, Yesterday, This Week, This Month, Custom
  const [customDates, setCustomDates] = useState({ start: new Date(), end: new Date() });
  const [showPicker, setShowPicker] = useState(null); // 'start' or 'end' or null

  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    orderCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    pendingCount: 0,
    avgOrderValue: 0,
    topProducts: [],
    staffPerformance: [],
    rawOrders: [] // For excel export
  });

  useEffect(() => {
    fetchReport();
  }, [range, customDates]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let startDate = new Date();
      let endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      if (range === 'Today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (range === 'Tomorrow') {
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (range === 'Yesterday') {
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (range === 'This Week') {
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (range === 'This Month') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else if (range === 'Custom') {
        startDate = new Date(customDates.start);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customDates.end);
        endDate.setHours(23, 59, 59, 999);
      }

      // 1. Fetch Orders
      const { data: orders, error: orderErr } = await supabase
        .from('orders')
        .select(`
          id, 
          total_amount, 
          status, 
          created_at, 
          customer_id,
          staff_id,
          profiles!customer_id (name, email),
          staff:profiles!staff_id (name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (orderErr) throw orderErr;

      // 2. Fetch Top Products (using order IDs from the orders we already fetched)
      const orderIds = orders?.map(o => o.id) || [];
      let items = [];
      
      if (orderIds.length > 0) {
        const { data: itemsData, error: itemErr } = await supabase
          .from('order_items')
          .select('product_id, blocks, total_price, products(name, emoji)')
          .in('order_id', orderIds);
        
        if (itemErr) throw itemErr;
        items = itemsData || [];
      }

      // Processing Logic
      let rev = 0, del = 0, can = 0, pen = 0;
      const staffMap = {};
      const prodMap = {};

      orders?.forEach(o => {
        if (o.status !== 'Cancelled') rev += (o.total_amount || 0);
        if (o.status === 'Delivered') del++;
        else if (o.status === 'Cancelled') can++;
        else pen++;

        if (o.staff?.name && o.status === 'Delivered') {
          staffMap[o.staff.name] = (staffMap[o.staff.name] || 0) + 1;
        }
      });

      items?.forEach(i => {
        const name = i.products?.name || 'Unknown';
        if (!prodMap[name]) prodMap[name] = { count: 0, emoji: i.products?.emoji || '📦' };
        prodMap[name].count += (i.blocks || 0);
      });

      const topProds = Object.keys(prodMap)
        .map(name => ({ name, ...prodMap[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const staffPerf = Object.keys(staffMap)
        .map(name => ({ name, count: staffMap[name] }))
        .sort((a, b) => b.count - a.count);

      setReportData({
        totalRevenue: rev,
        orderCount: orders?.length || 0,
        deliveredCount: del,
        cancelledCount: can,
        pendingCount: pen,
        avgOrderValue: orders?.length ? (rev / orders.length) : 0,
        topProducts: topProds,
        staffPerformance: staffPerf,
        rawOrders: orders || []
      });

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (reportData.rawOrders.length === 0) {
      Alert.alert('No Data', 'There is no data to export for this range.');
      return;
    }

    try {
      const exportData = reportData.rawOrders.map(o => ({
        OrderID: o.id,
        Date: new Date(o.created_at).toLocaleDateString(),
        Customer: o.profiles?.name || 'Unknown',
        Amount: o.total_amount,
        Status: o.status,
        Staff: o.staff?.name || 'Unassigned'
      }));

      await exportToExcel(exportData, `Avar_Report_${range}`);
    } catch (err) {
      Alert.alert('Export Failed', err.message);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const current = selectedDate || (showPicker === 'start' ? customDates.start : customDates.end);
    setShowPicker(null);
    if (showPicker === 'start') {
      setCustomDates(prev => ({ ...prev, start: current }));
    } else {
      setCustomDates(prev => ({ ...prev, end: current }));
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Professional Reports</Text>
        <TouchableOpacity onPress={handleExport} style={s.exportBtn}>
          <Text style={s.exportBtnTxt}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filters */}
      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {['Today', 'Tomorrow', 'Yesterday', 'This Week', 'This Month', 'Custom'].map(f => (
            <TouchableOpacity 
              key={f} 
              style={[s.filterTab, range === f && s.filterTabActive]} 
              onPress={() => setRange(f)}
            >
              <Text style={[s.filterTabTxt, range === f && s.filterTabTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {range === 'Custom' && (
        <View style={s.customDateBox}>
          <TouchableOpacity style={s.dateBtn} onPress={() => setShowPicker('start')}>
            <Text style={s.dateBtnLabel}>From:</Text>
            <Text style={s.dateBtnVal}>{customDates.start.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dateBtn} onPress={() => setShowPicker('end')}>
            <Text style={s.dateBtnLabel}>To:</Text>
            <Text style={s.dateBtnVal}>{customDates.end.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? customDates.start : customDates.end}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <ScrollView 
        contentContainerStyle={s.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReport(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Primary Metrics */}
            <View style={s.statsGrid}>
              <MetricCard label="Total Revenue" value={`₹${reportData.totalRevenue.toLocaleString()}`} color={COLORS.green} sub="Net Sales" />
              <MetricCard label="Total Orders" value={reportData.orderCount} color={COLORS.primary} sub={`${reportData.deliveredCount} Delivered`} />
            </View>

            <View style={s.statsGrid}>
              <MetricCard label="Avg. Order" value={`₹${Math.round(reportData.avgOrderValue)}`} color={COLORS.yellow} sub="Per Customer" />
              <MetricCard label="Active Status" value={reportData.pendingCount} color="#FF9500" sub="Need Attention" />
            </View>

            {/* Performance Breakdown */}
            <Text style={s.sectionTitle}>Order Status Breakdown</Text>
            <View style={s.card}>
               <StatusRow label="Delivered" count={reportData.deliveredCount} total={reportData.orderCount} color={COLORS.green} />
               <StatusRow label="Pending / Preparing" count={reportData.pendingCount} total={reportData.orderCount} color={COLORS.yellow} />
               <StatusRow label="Cancelled" count={reportData.cancelledCount} total={reportData.orderCount} color={COLORS.danger} />
            </View>

            {/* Top Products */}
            <Text style={s.sectionTitle}>Top Selling Products</Text>
            <View style={s.card}>
              {reportData.topProducts.map((p, i) => (
                <View key={i} style={[s.listItem, i < reportData.topProducts.length - 1 && s.divider]}>
                  <Text style={s.listEmoji}>{p.emoji}</Text>
                  <Text style={s.listName}>{p.name}</Text>
                  <Text style={s.listVal}>{p.count} units</Text>
                </View>
              ))}
              {reportData.topProducts.length === 0 && <Text style={s.emptyTxt}>No products sold in this period.</Text>}
            </View>

            {/* Staff Performance */}
            <Text style={s.sectionTitle}>Staff Delivery Performance</Text>
            <View style={s.card}>
              {reportData.staffPerformance.map((s, i) => (
                <View key={i} style={[s.listItem, i < reportData.staffPerformance.length - 1 && s.divider]}>
                  <View style={s.staffInitial}><Text style={s.initialTxt}>{s.name[0]}</Text></View>
                  <Text style={s.listName}>{s.name}</Text>
                  <Text style={s.listVal}>{s.count} Deliv.</Text>
                </View>
              ))}
              {reportData.staffPerformance.length === 0 && <Text style={s.emptyTxt}>No staff activity recorded.</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const MetricCard = ({ label, value, color, sub }) => (
  <View style={s.metricCard}>
    <Text style={s.metricLabel}>{label}</Text>
    <Text style={[s.metricValue, { color }]}>{value}</Text>
    <Text style={s.metricSub}>{sub}</Text>
  </View>
);

const StatusRow = ({ label, count, total, color }) => {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={s.statusRow}>
      <View style={s.statusInfo}>
        <Text style={s.statusLabel}>{label}</Text>
        <Text style={s.statusCount}>{count}</Text>
      </View>
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.sm
  },
  backBtn:     { width: 38, alignItems: 'flex-start' },
  backArrow:   { fontSize: 24, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: COLORS.textDark },
  exportBtn:   { backgroundColor: COLORS.greenLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  exportBtnTxt:{ color: COLORS.green, fontWeight: 'bold', fontSize: 12 },

  filterBar: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterScroll: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: COLORS.bgLight },
  filterTabActive: { backgroundColor: COLORS.primary },
  filterTabTxt: { fontSize: 12, fontWeight: '600', color: COLORS.textMed },
  filterTabTxtActive: { color: COLORS.white },

  customDateBox: { flexDirection: 'row', backgroundColor: COLORS.white, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 10 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgLight, padding: 10, borderRadius: 8, justifyContent: 'space-between' },
  dateBtnLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.textGray },
  dateBtnVal: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },

  scroll: { padding: SPACING.lg, paddingBottom: 120 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textDark, marginBottom: SPACING.md, marginTop: SPACING.lg, textTransform: 'uppercase', letterSpacing: 1 },

  statsGrid: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  metricCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOW.sm },
  metricLabel: { fontSize: 11, fontWeight: 'bold', color: COLORS.textGray, textTransform: 'uppercase' },
  metricValue: { fontSize: 22, fontWeight: '900', marginVertical: 4 },
  metricSub: { fontSize: 10, color: COLORS.textMed, fontWeight: '500' },

  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOW.sm },
  statusRow: { marginBottom: 16 },
  statusInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statusLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  statusCount: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  progressBg: { height: 6, backgroundColor: COLORS.bgLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' },

  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.bgLight },
  listEmoji: { fontSize: 24, marginRight: 12 },
  listName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  listVal: { fontSize: 14, fontWeight: '800', color: COLORS.green },
  emptyTxt: { textAlign: 'center', color: COLORS.textGray, fontSize: 12, paddingVertical: 10 },

  staffInitial: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  initialTxt: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
});

export default AdminAnalyticsScreen;
