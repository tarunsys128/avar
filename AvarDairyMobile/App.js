import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  useEffect(() => {
    // Only check for updates on mount; requesting all permissions aggressively at launch
    // freezes or crashes some Android devices (especially custom ROMs) and blocks UI thread.
    // Permissions should be requested contextually when needed in the app instead.
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    if (__DEV__) return;
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          'Update Available',
          'A new version of Avar Dairy is available. The app will now restart to apply changes.',
          [{ text: 'Restart Now', onPress: () => Updates.reloadAsync() }]
        );
      }
    } catch (e) {
      console.log('Update check failed:', e);
    }
  };

  const requestAllPermissions = async () => {
    try {
      // 1. Notifications
      const { status: notifyStatus } = await Notifications.requestPermissionsAsync();
      
      // 2. Location (for delivery & maps)
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();

      // 3. Camera (for profile photos)
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();

      // 4. Media Library (for picking photos)
      const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      console.log('[Permissions] Final statuses:', { 
        notify: notifyStatus, 
        location: locStatus, 
        camera: camStatus, 
        library: libStatus 
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        
        // Channel for order alerts
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Orders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#10B981',
        });
      }
    } catch (e) {
      console.log('Error requesting permissions:', e);
    }
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
