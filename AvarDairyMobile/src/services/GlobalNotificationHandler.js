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

  useEffect(() => {
    // Only staff and admins should receive these background alerts
    if (!currentUser || (userRole !== 'staff' && userRole !== 'admin')) {
      return;
    }

    console.log('[GlobalNotifications] Starting listener for staff:', currentUser.email);

    // Initial check to avoid notifying for existing orders on mount
    const markExistingOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'Pending');
      
      if (data) {
        data.forEach(o => knownOrderIds.current.add(o.id));
      }
    };
    markExistingOrders();

    const channelId = `global-staff-notify-${currentUser.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new;
          if (newOrder.status === 'Pending' && !knownOrderIds.current.has(newOrder.id)) {
            knownOrderIds.current.add(newOrder.id);
            
            // Trigger a physical notification on the device
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

    return () => {
      console.log('[GlobalNotifications] Cleaning up listener');
      supabase.removeChannel(channel);
    };
  }, [currentUser, userRole]);

  return null; // This is a logic-only component
};

export default GlobalNotificationHandler;
