/**
 * notificationService.js
 * Handles Expo push token registration, local notifications,
 * and writing notification records to Supabase.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

// ─── Configure how notifications are displayed when app is foregrounded ────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Register for Push Notifications & return Expo push token ─────────────────
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    // Simulator/emulator — skip (no real push token available)
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  // Android: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '94dcbafa-0205-4cef-9609-062fa8d09cdf',
    });
    return tokenData.data;
  } catch (err) {
    console.log('[Notifications] Failed to get push token:', err.message);
    return null;
  }
}

// ─── Save push token to current user's profile ────────────────────────────────
export async function savePushToken(userId, token) {
  if (!userId || !token) return;
  try {
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
  } catch (err) {
    console.log('[Notifications] Failed to save push token:', err.message);
  }
}

// ─── Send a local notification on this device ─────────────────────────────────
export async function sendLocalNotification({ title, body, data = {}, channelId = 'orders' }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: null,
    });
  } catch (err) {
    console.log('[Notifications] Failed to send local notification:', err.message);
  }
}

// ─── Write a notification record to Supabase (builds in-app inbox) ─────────────
export async function createNotification({ userId, title, body, type = 'general', orderId = null }) {
  if (!userId) return;
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      body,
      type,
      order_id: orderId,
      is_read: false,
    });
  } catch (err) {
    console.log('[Notifications] Failed to create notification record:', err.message);
  }
}

// ─── Notify all admins and all staff about a new order ────────────────────────
export async function notifyStaffAndAdmin({ orderId, customerName, totalAmount }) {
  try {
    // Fetch all admin + staff users
    const { data: staffAdmins, error } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'staff']);

    if (error || !staffAdmins) return;

    const title = '🛒 New Order Received!';
    const body = `${customerName || 'A customer'} placed an order of ₹${totalAmount}`;

    // Bulk insert notifications for all staff/admin
    const rows = staffAdmins.map(u => ({
      user_id: u.id,
      title,
      body,
      type: 'order_placed',
      order_id: orderId,
      is_read: false,
    }));

    if (rows.length > 0) {
      await supabase.from('notifications').insert(rows);
    }
  } catch (err) {
    console.log('[Notifications] Failed to notify staff/admin:', err.message);
  }
}

// ─── Notify a customer about an order status change ───────────────────────────
export async function notifyCustomerOrderStatus({ customerId, orderId, newStatus }) {
  if (!customerId || !orderId) return;

  const messages = {
    Accepted:          { title: '✅ Order Accepted!',       body: 'Your order has been accepted and will be processed shortly.' },
    Preparing:         { title: '👨‍🍳 Order Being Prepared!', body: 'Our team is preparing your fresh dairy products.' },
    Ready:             { title: '📦 Order Ready!',          body: 'Your order is packed and ready for pickup/delivery.' },
    'Out for Delivery':{ title: '🛵 Out for Delivery!',     body: 'Your order is on the way. Expect it soon!' },
    Delivered:         { title: '🏠 Order Delivered!',      body: 'Your order has been delivered. Enjoy your dairy products!' },
    Cancelled:         { title: '❌ Order Cancelled',       body: 'Your order has been cancelled. Contact us if you need help.' },
  };

  const msg = messages[newStatus];
  if (!msg) return;

  try {
    await createNotification({
      userId: customerId,
      title: msg.title,
      body: msg.body,
      type: 'order_status',
      orderId,
    });
  } catch (err) {
    console.log('[Notifications] Failed to notify customer:', err.message);
  }
}
