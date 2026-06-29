import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const TYPE_ICON = {
  order_placed: '🛒',
  order_status: '📦',
  general:      '🔔',
};

const CustomerNotificationsScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
    setRefreshing(false);
  }, [currentUser?.id]);

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel(`notifications-${currentUser?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser?.id}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!currentUser?.id) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUser.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const formatTime = (iso) => {
    const now = new Date();
    const date = new Date(iso);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[s.notifCard, !item.is_read && s.notifCardUnread]}
      activeOpacity={0.7}
      onPress={() => {
        if (!item.is_read) markRead(item.id);
        if (item.order_id) {
          navigation.navigate('OrderTracking', { orderId: item.order_id });
        }
      }}
    >
      <View style={s.notifIconWrap}>
        <Text style={s.notifIcon}>{TYPE_ICON[item.type] || '🔔'}</Text>
        {!item.is_read && <View style={s.unreadDot} />}
      </View>
      <View style={s.notifContent}>
        <Text style={[s.notifTitle, !item.is_read && s.notifTitleUnread]}>
          {item.title}
        </Text>
        <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={s.notifTime}>{formatTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} style={s.markAllBtn}>
            <Text style={s.markAllTxt}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[s.list, notifications.length === 0 && s.listEmpty]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🔔</Text>
            <Text style={s.emptyTitle}>No Notifications Yet</Text>
            <Text style={s.emptyTxt}>
              We'll notify you when your order is updated.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.sm,
  },
  backBtn:     { width: 38, alignItems: 'flex-start' },
  backArrow:   { fontSize: 22, color: COLORS.textDark },
  headerCenter:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  badge:       { backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 6, paddingHorizontal: 4 },
  badgeTxt:    { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  markAllBtn:  { width: 80, alignItems: 'flex-end' },
  markAllTxt:  { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  list:      { padding: SPACING.md, paddingBottom: 40 },
  listEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  notifCard: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
    ...SHADOW.sm, alignItems: 'flex-start',
  },
  notifCardUnread: {
    backgroundColor: '#F0FDF4', borderLeftWidth: 3, borderLeftColor: COLORS.green,
  },

  notifIconWrap: { position: 'relative', marginRight: SPACING.md },
  notifIcon: { fontSize: 28 },
  unreadDot: {
    position: 'absolute', top: 0, right: -2, width: 10, height: 10,
    borderRadius: 5, backgroundColor: COLORS.green, borderWidth: 1.5, borderColor: COLORS.white,
  },

  notifContent: { flex: 1 },
  notifTitle:   { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold, color: COLORS.textMed, marginBottom: 2 },
  notifTitleUnread: { fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  notifBody:    { fontSize: FONTS.sizes.sm, color: COLORS.textMed, lineHeight: 18, marginBottom: 4 },
  notifTime:    { fontSize: FONTS.sizes.xs, color: COLORS.textLight },

  empty: { alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: 60 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: 8 },
  emptyTxt:   { fontSize: FONTS.sizes.base, color: COLORS.textGray, textAlign: 'center', lineHeight: 22 },
});

export default CustomerNotificationsScreen;
