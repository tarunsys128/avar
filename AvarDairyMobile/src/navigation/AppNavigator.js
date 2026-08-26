import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS, FONTS } from '../constants/theme';
import SplashVideoScreen from '../screens/SplashVideoScreen';

// ─── Auth ───────────────────────────────────────────────────────────────────────
import LoginScreen from '../screens/auth/LoginScreen';

// ─── Customer ──────────────────────────────────────────────────────────────────
import HomeScreen           from '../screens/customer/HomeScreen';
import CategoryScreen       from '../screens/customer/CategoryScreen';
import CartScreen           from '../screens/customer/CartScreen';
import AddressSelectionScreen from '../screens/customer/AddressSelectionScreen';
import OrdersScreen         from '../screens/customer/OrdersScreen';
import OrderTrackingScreen  from '../screens/customer/OrderTrackingScreen';
import ProfileScreen        from '../screens/customer/ProfileScreen';
import CustomerAddressesScreen from '../screens/customer/CustomerAddressesScreen';
import CustomerPaymentsScreen from '../screens/customer/CustomerPaymentsScreen';
import CustomerNotificationsScreen from '../screens/customer/CustomerNotificationsScreen';
import CustomerPrivacyScreen from '../screens/customer/CustomerPrivacyScreen';
import HelpSupportScreen from '../screens/customer/HelpSupportScreen';

// ─── Staff ─────────────────────────────────────────────────────────────
import StaffDashboardScreen  from '../screens/staff/DashboardScreen';
import StaffHistoryScreen    from '../screens/staff/StaffHistoryScreen';
import StaffProfileScreen    from '../screens/staff/StaffProfileScreen';

// ─── Admin ─────────────────────────────────────────────────────────────
import AdminDashboardScreen  from '../screens/admin/DashboardScreen';
import AdminOrdersScreen     from '../screens/admin/AdminOrdersScreen';
import ManageStaffScreen     from '../screens/admin/ManageStaffScreen';
import ManageProductsScreen  from '../screens/admin/ManageProductsScreen';
import AdminProfileScreen    from '../screens/admin/AdminProfileScreen';

import GenericSettingsScreen from '../screens/GenericSettingsScreen';
import EditCustomerProfileScreen from '../screens/customer/EditCustomerProfileScreen';
import AdminCustomersScreen from '../screens/admin/AdminCustomersScreen';
import AdminProductFormScreen from '../screens/admin/AdminProductFormScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminNotificationsScreen from '../screens/admin/AdminNotificationsScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminChangePasswordScreen from '../screens/admin/AdminChangePasswordScreen';
import ReminderSettingsScreen from '../screens/shared/ReminderSettingsScreen';
import GlobalNotificationHandler from '../services/GlobalNotificationHandler';

const Tab        = createBottomTabNavigator();
const RootStack  = createStackNavigator();
const HomeStack  = createStackNavigator();
const CatStack   = createStackNavigator();
const CartStack  = createStackNavigator();
const OrderStack = createStackNavigator();
const ProfileSt  = createStackNavigator();
const AdminSt    = createStackNavigator();
const StaffSt    = createStackNavigator();

// ─── Tab Icons ─────────────────────────────────────────────────────────────────
const TabIcon = ({ name, focused }) => (
  <View style={[ti.iconContainer, focused && ti.iconContainerActive]}>
    <Ionicons 
      name={focused ? name : `${name}-outline`} 
      size={24} 
      color={focused ? COLORS.primary : COLORS.textGray} 
    />
  </View>
);

const ti = StyleSheet.create({
  iconContainer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 4,
  },
  iconContainerActive: { 
    backgroundColor: COLORS.primaryLight 
  },
});

const CartTabIcon = ({ focused }) => {
  const { getCartCount } = useCart();
  const count = getCartCount();
  return (
    <View style={[ti.iconContainer, focused && ti.iconContainerActive, { position: 'relative' }]}>
      <Ionicons 
        name={focused ? 'cart' : 'cart-outline'} 
        size={24} 
        color={focused ? COLORS.primary : COLORS.textGray} 
      />
      {count > 0 && (
        <View style={badge.dot}>
          <Text style={badge.txt}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
};

const badge = StyleSheet.create({
  dot: {
    position: 'absolute', top: -4, right: -8,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  txt: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

// ─── Per-Tab Stacks ─────────────────────────────────────────────────────────────
const noHeader = { headerShown: false };

const HomeTabStack = () => (
  <HomeStack.Navigator screenOptions={noHeader}>
    <HomeStack.Screen name="HomeMain"      component={HomeScreen} />
    <HomeStack.Screen name="Categories"    component={CategoryScreen} />
    <HomeStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </HomeStack.Navigator>
);

const CatTabStack = () => (
  <CatStack.Navigator screenOptions={noHeader}>
    <CatStack.Screen
      name="CategoriesMain"
      component={CategoryScreen}
      initialParams={{ category: 'Paneer', categoryKey: 'paneer' }}
    />
    <CatStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </CatStack.Navigator>
);

const CartTabStack = () => (
  <CartStack.Navigator screenOptions={noHeader}>
    <CartStack.Screen name="CartMain"      component={CartScreen} />
    <CartStack.Screen name="AddressSelection" component={AddressSelectionScreen} />
    <CartStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </CartStack.Navigator>
);

const OrdersTabStack = () => (
  <OrderStack.Navigator screenOptions={noHeader}>
    <OrderStack.Screen name="OrdersMain"   component={OrdersScreen} />
    <OrderStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </OrderStack.Navigator>
);

const ProfileTabStack = () => (
  <ProfileSt.Navigator screenOptions={noHeader}>
    <ProfileSt.Screen name="ProfileMain"  component={ProfileScreen} />
    <ProfileSt.Screen name="EditCustomerProfile" component={EditCustomerProfileScreen} />
    <ProfileSt.Screen name="GenericSettings" component={GenericSettingsScreen} />
    <ProfileSt.Screen name="Orders" component={OrdersScreen} />
    <ProfileSt.Screen name="OrderTracking" component={OrderTrackingScreen} />
    <ProfileSt.Screen name="CustomerAddresses" component={CustomerAddressesScreen} />
    <ProfileSt.Screen name="CustomerPayments" component={CustomerPaymentsScreen} />
    <ProfileSt.Screen name="CustomerNotifications" component={CustomerNotificationsScreen} />
    <ProfileSt.Screen name="CustomerPrivacy" component={CustomerPrivacyScreen} />
    <ProfileSt.Screen name="HelpSupport" component={HelpSupportScreen} />
    <ProfileSt.Screen name="Reminders" component={ReminderSettingsScreen} />
  </ProfileSt.Navigator>
);

// ─── Shared Tab Bar Style ───────────────────────────────────────────────────────
const professionalTabBarStyle = {
  height: 65,
  backgroundColor: COLORS.white,
  paddingBottom: 8,
  paddingTop: 8,
  borderTopWidth: 0,
  elevation: 16,
  shadowColor: '#1A202C',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: -6 },
};

const commonScreenOptions = {
  headerShown: false,
  tabBarShowLabel: true,
  tabBarActiveTintColor: COLORS.primaryDark,
  tabBarInactiveTintColor: COLORS.textGray,
  tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -4 },
  tabBarStyle: professionalTabBarStyle,
};

// ─── Customer Bottom Tabs ─────────────────────────────────────────────────────
const CustomerTabs = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen
      name="HomeTab"
      component={HomeTabStack}
      options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      listeners={({ navigation }) => ({
        tabPress: (e) => { e.preventDefault(); navigation.navigate('HomeTab', { screen: 'HomeMain' }); },
      })}
    />
    <Tab.Screen
      name="CategoriesTab"
      component={CatTabStack}
      options={{ tabBarLabel: 'Products', tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} /> }}
      listeners={({ navigation }) => ({
        tabPress: (e) => { e.preventDefault(); navigation.navigate('CategoriesTab', { screen: 'CategoriesMain' }); },
      })}
    />
    <Tab.Screen
      name="CartTab"
      component={CartTabStack}
      options={{ tabBarLabel: 'Cart', tabBarIcon: ({ focused }) => <CartTabIcon focused={focused} /> }}
      listeners={({ navigation }) => ({
        tabPress: (e) => { e.preventDefault(); navigation.navigate('CartTab', { screen: 'CartMain' }); },
      })}
    />
    <Tab.Screen
      name="OrdersTab"
      component={OrdersTabStack}
      options={{ tabBarLabel: 'Orders', tabBarIcon: ({ focused }) => <TabIcon name="receipt" focused={focused} /> }}
      listeners={({ navigation }) => ({
        tabPress: (e) => { e.preventDefault(); navigation.navigate('OrdersTab', { screen: 'OrdersMain' }); },
      })}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileTabStack}
      options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          navigation.navigate('ProfileTab', { screen: 'ProfileMain' });
        },
      })}
    />
  </Tab.Navigator>
);

const StaffTabs = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen name="StaffDash" component={StaffDashboardScreen} options={{ tabBarLabel: 'My Tasks', tabBarIcon: ({ focused }) => <TabIcon name="bicycle" focused={focused} /> }} />
    <Tab.Screen name="StaffHist" component={StaffHistoryScreen}   options={{ tabBarLabel: 'History', tabBarIcon: ({ focused }) => <TabIcon name="time" focused={focused} /> }} />
    <Tab.Screen name="Profile"   component={StaffProfileScreen}   options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }} />
  </Tab.Navigator>
);

const StaffRootStack = () => (
  <StaffSt.Navigator screenOptions={noHeader}>
    <StaffSt.Screen name="StaffTabsMain" component={StaffTabs} />
    <StaffSt.Screen name="Notifications" component={CustomerNotificationsScreen} />
    <StaffSt.Screen name="GenericSettings" component={GenericSettingsScreen} />
    <StaffSt.Screen name="Reminders" component={ReminderSettingsScreen} />
  </StaffSt.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator screenOptions={commonScreenOptions}>
    <Tab.Screen name="AdminDash"  component={AdminDashboardScreen} options={{ tabBarLabel: 'Stats', tabBarIcon: ({ focused }) => <TabIcon name="analytics" focused={focused} /> }} />
    <Tab.Screen name="AdminOrds"  component={AdminOrdersScreen}    options={{ tabBarLabel: 'Orders', tabBarIcon: ({ focused }) => <TabIcon name="list" focused={focused} /> }} />
    <Tab.Screen name="AdminStaff" component={ManageStaffScreen}    options={{ tabBarLabel: 'Staff', tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} /> }} />
    <Tab.Screen name="AdminProds" component={ManageProductsScreen} options={{ tabBarLabel: 'Products', tabBarIcon: ({ focused }) => <TabIcon name="cube" focused={focused} /> }} />
    <Tab.Screen name="Profile"    component={AdminProfileScreen}   options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }} />
  </Tab.Navigator>
);

const AdminRootStack = () => (
  <AdminSt.Navigator screenOptions={noHeader}>
    <AdminSt.Screen name="AdminTabsMain" component={AdminTabs} />
    <AdminSt.Screen name="Notifications" component={CustomerNotificationsScreen} />
    <AdminSt.Screen name="AdminCustomers" component={AdminCustomersScreen} />
    <AdminSt.Screen name="AdminProductForm" component={AdminProductFormScreen} />
    <AdminSt.Screen name="AdminSettings" component={AdminSettingsScreen} />
    <AdminSt.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
    <AdminSt.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
    <AdminSt.Screen name="AdminChangePassword" component={AdminChangePasswordScreen} />
    <AdminSt.Screen name="GenericSettings" component={GenericSettingsScreen} />
    <AdminSt.Screen name="Reminders" component={ReminderSettingsScreen} />
  </AdminSt.Navigator>
);

const AuthStack = () => (
  <RootStack.Navigator screenOptions={noHeader}>
    <RootStack.Screen name="Login" component={LoginScreen} />
  </RootStack.Navigator>
);

// ─── Root ─────────────────────────────────────────────────────────────────────
export const AppNavigator = () => {
  const { currentUser, userRole, loading } = useAuth();
  const appVariant = Constants.expoConfig?.extra?.variant || 'customer';
  const [introFinished, setIntroFinished] = useState(false);

  // Show intro video immediately, and hold it if app is still loading config/auth
  if (!introFinished || loading) {
    return <SplashVideoScreen onFinish={() => setIntroFinished(true)} isAuthLoading={loading} />;
  }

  if (!currentUser) return <AuthStack />;

  // Smart Role-Based Navigation
  // The 'admin' variant app hosts both Admin and Staff UIs
  if (appVariant === 'admin') {
    if (userRole === 'admin') return (<>
      <GlobalNotificationHandler />
      <AdminRootStack />
    </>);
    if (userRole === 'staff') return (<>
      <GlobalNotificationHandler />
      <StaffRootStack />
    </>);
    return <AuthStack />; // fallback
  }

  // Regular Customer Navigation (customer variant)
  return (
    <>
      <GlobalNotificationHandler />
      <CustomerTabs />
    </>
  );
};
