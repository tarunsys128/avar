import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const AdminNotificationsScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['customer', 'staff']);
    if (!error) setUserCount(count || 0);
  };

  const handleSendPush = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing Details', 'Please enter a title and message.');
      return;
    }
    Alert.alert(
      'Confirm Dispatch',
      `Are you sure you want to send this notification to ${userCount} users (Customers & Staff)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Now', onPress: dispatchToAll }
      ]
    );
  };

  const dispatchToAll = async () => {
    setLoading(true);
    try {
      // 1. Fetch all customer & staff IDs and push tokens
      const { data: customers, error: cError } = await supabase
        .from('profiles')
        .select('id, push_token')
        .in('role', ['customer', 'staff']);

      if (cError) throw cError;
      if (!customers || customers.length === 0) {
        Alert.alert('No Users Found', 'There are no customers or staff to send notifications to.');
        setLoading(false);
        return;
      }

      // 2. Prepare bulk insert payload
      const payloads = customers.map(c => ({
        user_id: c.id,
        title: title.trim(),
        body: message.trim(),
        type: 'ORDER_REMINDER',
        is_read: false
      }));

      // 3. Insert into notifications table
      const { error: insError } = await supabase.from('notifications').insert(payloads);
      
      if (insError) throw insError;

      // 4. Send Remote Push Notifications via Expo Push API
      const expoPushMessages = customers
        .filter(c => c.push_token && (c.push_token.startsWith('ExponentPushToken') || c.push_token.startsWith('ExpoPushToken')))
        .map(c => ({
          to: c.push_token,
          title: title.trim(),
          body: message.trim(),
          sound: 'default',
          data: { type: 'ORDER_REMINDER' },
        }));

      if (expoPushMessages.length > 0) {
        try {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(expoPushMessages),
          });
        } catch (pushErr) {
          console.error('Push API Error:', pushErr);
        }
      }

      Alert.alert('Success', 'Push notifications dispatched successfully!');
      setTitle('');
      setMessage('');
    } catch (err) {
      Alert.alert('Dispatch Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Push Operations</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.bannerInfo}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} style={{marginRight: 10}} />
          <Text style={s.bannerTxt}>Use this tool to manually dispatch order reminders and marketing promotions to your customers. Ensure messages are clear and actionable.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Manual Dispatch</Text>
          
          <Text style={s.label}>Notification Title</Text>
          <TextInput 
            style={s.input} 
            placeholder="e.g., Don't forget your Paneer for tomorrow!" 
            value={title} 
            onChangeText={setTitle} 
          />

          <Text style={s.label}>Notification Message</Text>
          <TextInput 
            style={[s.input, { height: 100, textAlignVertical: 'top' }]} 
            placeholder="Type your message here..." 
            multiline 
            value={message} 
            onChangeText={setMessage} 
          />

          <View style={s.audienceBox}>
            <Ionicons name="people" size={20} color={COLORS.textGray} />
            <Text style={s.audienceTxt}>Audience: All Active Customers ({userCount})</Text>
          </View>

          <TouchableOpacity style={s.dispatchBtn} onPress={handleSendPush} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="send" size={18} color={COLORS.white} style={{marginRight: 8}} />
                <Text style={s.dispatchBtnTxt}>Dispatch Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  scroll: { padding: SPACING.lg },
  bannerInfo: { flexDirection: 'row', backgroundColor: COLORS.primaryLight, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg, alignItems: 'center' },
  bannerTxt: { flex: 1, color: COLORS.primaryDark, fontSize: FONTS.sizes.sm, lineHeight: 20 },
  card: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.lg, ...SHADOW.sm },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.lg },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginBottom: 8, fontWeight: FONTS.weights.medium },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.textDark, backgroundColor: '#FAFAFA', marginBottom: SPACING.lg },
  audienceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.xl },
  audienceTxt: { marginLeft: 8, fontSize: FONTS.sizes.sm, color: COLORS.textGray, fontWeight: FONTS.weights.semibold },
  dispatchBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  dispatchBtnTxt: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
});

export default AdminNotificationsScreen;
