import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, ShoppingCart, User, ClipboardList, Package, Users } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

// Placeholders for Screens
import LoginScreen from '../screens/auth/LoginScreen';
import CustomerHomeScreen from '../screens/customer/HomeScreen';
import CustomerCartScreen from '../screens/customer/CartScreen';
import CustomerProfileScreen from '../screens/customer/ProfileScreen';
import StaffDashboardScreen from '../screens/staff/DashboardScreen';
import AdminDashboardScreen from '../screens/admin/DashboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomerTabs = () => (
  <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#4F46E5', headerShown: true }}>
    <Tab.Screen 
      name="Home" 
      component={CustomerHomeScreen} 
      options={{ tabBarIcon: ({ color }) => <Home color={color} size={24} /> }} 
    />
    <Tab.Screen 
      name="Cart" 
      component={CustomerCartScreen} 
      options={{ tabBarIcon: ({ color }) => <ShoppingCart color={color} size={24} /> }} 
    />
    <Tab.Screen 
      name="Profile" 
      component={CustomerProfileScreen} 
      options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }} 
    />
  </Tab.Navigator>
);

const StaffStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} options={{ title: 'Staff Dashboard' }} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    // Return null or a splash screen
    return null;
  }

  if (!currentUser) {
    return <AuthStack />;
  }

  // Role based routing
  if (userRole === 'admin') return <AdminStack />;
  if (userRole === 'staff') return <StaffStack />;
  
  // Default to customer
  return <CustomerTabs />;
};
