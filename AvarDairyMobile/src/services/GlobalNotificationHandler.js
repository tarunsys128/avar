import React, { useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { sendLocalNotification } from './notificationService';

/**
 * GlobalNotificationHandler
 * Listens for new orders in the background (as long as app is open)
 * and alerts staff members immediately.
 */
const GlobalNotificationHandler = () => {
  const { currentUser, userRole } = useAuth();
  const knownOrderIds = useRef(new Set());
  let activeChannel = null;

  useEffect(() => {
    // --- Staff / Admin Logic ---
    if (userRole === 'staff' || userRole === 'admin') {
      console.log('[GlobalNotifications] Starting listener for staff/admin:', currentUser.email);
      const markExistingOrders = async () => {
        const { data } = await supabase.from('orders').select('id').eq('status', 'Pending');
        if (data) data.forEach(o => knownOrderIds.current.add(o.id));
      };
      markExistingOrders();

      const channelId = `global-staff-notify-${currentUser.id}-${Date.now()}`;
      activeChannel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const newOrder = payload.new;
            if (newOrder.status === 'Pending' && !knownOrderIds.current.has(newOrder.id)) {
              knownOrderIds.current.add(newOrder.id);
              sendLocalNotification({
                title: '🛒 New Order Received!',
                body: `A new order of ₹${newOrder.total_amount} just arrived.`,
                data: { orderId: newOrder.id },
                channelId: 'orders',
              });
            }
          }
        )
        .subscribe();
    }
    
    // --- Customer Logic ---
    if (userRole === 'customer') {
      console.log('[GlobalNotifications] Starting listener for customer:', currentUser.email);
      const channelId = `global-cust-notify-${currentUser.id}-${Date.now()}`;
      activeChannel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
          (payload) => {
            const notif = payload.new;
            sendLocalNotification({
              title: notif.title || 'Avar Dairy',
              body: notif.message,
              data: { notifId: notif.id },
              channelId: 'default',
            });
          }
        )
        .subscribe();
        
      // Auto Local Timer (Wait 10 seconds then set a schedule for 2 days from now to remind them to order)
      setTimeout(async () => {
         // Clear previous ones first if any
         // Using expo-notifications to schedule
         const Notifications = require('expo-notifications');
         await Notifications.cancelAllScheduledNotificationsAsync();
         await Notifications.scheduleNotificationAsync({
            content: {
               title: '🥛 Fresh Dairy Awaits!',
               body: 'It\'s been a while, time to order some fresh Paneer and Milk!',
               sound: true,
            },
            trigger: { seconds: 172800 }, // 48 hours
         });
      }, 5000);
    }

    return () => {
      console.log('[GlobalNotifications] Cleaning up listener');
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, [currentUser, userRole]);

  return null; // This is a logic-only component
};

export default GlobalNotificationHandler;
