import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../supabase';
import { registerForPushNotifications, savePushToken } from '../services/notificationService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'customer', 'staff', 'admin'
  const [loading, setLoading] = useState(true);
  const profileSubscription = useRef(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      if (profileSubscription.current) {
        supabase.removeChannel(profileSubscription.current);
      }
    };
  }, []);

  const handleSession = async (session) => {
    if (session?.user) {
      await fetchAndSetProfile(session.user, session);
      subscribeToProfile(session.user.id);
    } else {
      if (profileSubscription.current) {
        supabase.removeChannel(profileSubscription.current);
        profileSubscription.current = null;
      }
      setCurrentUser(null);
      setUserRole(null);
    }
    setLoading(false);
  };

  const fetchAndSetProfile = async (user, session = null) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    const createdProfile = data || (await getOrCreateMissingProfile(user));
    const role = createdProfile ? createdProfile.role : 'customer';
    const appVariant = Constants.expoConfig?.extra?.variant || 'customer';

    if (createdProfile?.is_blocked) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setUserRole(null);
      Alert.alert('Access Denied', 'Your account has been blocked. Please contact support.');
      return;
    }

    if (appVariant === 'admin') {
      if (role !== 'admin' && role !== 'staff') {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setUserRole(null);
        Alert.alert('Access Denied', `This app is for Admins and Staff. Your role is ${role}.`);
        return;
      }
      // Staff must be approved by admin
      if (role === 'staff' && data?.is_approved === false) {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setUserRole(null);
        Alert.alert('Pending Approval', 'Your staff account is awaiting Admin approval. Please contact your Admin.');
        return;
      }
    } else {
      // Customer app
      if (role !== 'customer' && role !== 'admin') {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setUserRole(null);
        Alert.alert('Access Denied', `This app is for Customers. Your role is ${role}.`);
        return;
      }
      // Wait, we need to ensure the profile is evaluated with proper role
      // But the missing profile gets resolved above!
    }

    if (createdProfile) {
      setUserRole(createdProfile.role);
      setCurrentUser({ ...(session?.user || user), ...createdProfile });
      
      // Register push token and save to DB (only if we have a session)
      if (session) {
        registerForPushNotifications().then(token => {
          if (token) savePushToken(user.id, token);
        });
      }
    } else {
      setUserRole('customer');
      setCurrentUser(session?.user || user);
    }
  };

  const getOrCreateMissingProfile = async (user) => {
    // Create missing profile based on user metadata
    const metadataRole = user.user_metadata?.role || 'customer';
    const isStaff = metadataRole === 'staff';
    // Use name from metadata, fallback to email prefix (never hardcode 'Customer')
    const displayName = user.user_metadata?.name 
      || user.user_metadata?.full_name
      || user.email?.split('@')[0] 
      || 'User';
    
    const newProfile = {
      id: user.id,
      email: user.email,
      name: displayName,
      phone: user.user_metadata?.phone || '',
      role: metadataRole,
      is_approved: isStaff ? false : null,
      created_at: new Date().toISOString()
    };
    
    const { data: created, error: createErr } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();
      
    if (!createErr && created) {
      return created;
    }
    return newProfile;
  };

  const subscribeToProfile = (userId) => {
    if (profileSubscription.current) {
      supabase.removeChannel(profileSubscription.current);
    }

    profileSubscription.current = supabase
      .channel(`public:profiles:id=eq.${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles', 
        filter: `id=eq.${userId}` 
      }, (payload) => {
        setCurrentUser(prev => prev ? { ...prev, ...payload.new } : null);
        if (payload.new?.role) setUserRole(payload.new.role);
      })
      .subscribe();
  };

  const refreshProfile = async () => {
    if (currentUser?.id) {
      await fetchAndSetProfile({ id: currentUser.id, email: currentUser.email });
    }
  };

  const loginWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };

    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_blocked, is_approved')
        .eq('id', data.user.id)
        .single();
        
      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        return { error: new Error('Your account has been blocked. Please contact support.') };
      }

      const role = profile ? profile.role : 'customer';
      const appVariant = Constants.expoConfig?.extra?.variant || 'customer';

      if (appVariant === 'admin') {
        if (role !== 'admin' && role !== 'staff') {
          await supabase.auth.signOut();
          return { error: new Error(`Access Denied: This app is for Admins and Staff. Your role is ${role}.`) };
        }
        // Staff approval check
        if (role === 'staff' && profile?.is_approved === false) {
          await supabase.auth.signOut();
          return { error: new Error('Your staff account is pending Admin approval. Please contact your Admin.') };
        }
      } else {
        if (role !== 'customer' && role !== 'admin') {
          await supabase.auth.signOut();
          return { error: new Error(`Access Denied: This app is for Customers. Your role is ${role}.`) };
        }
      }
    }
    return { data, error: null };
  };

  const signupWithEmail = async (email, password, name, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name: name || '',
        phone: phone || '',
        role: 'customer'
      });
    }
    
    return data;
  };

  const resetPassword = async (email) => {
    // Sending email for password reset (OTP inside email usually)
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  };

  const verifyOtp = async (email, otp) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });
    return { data, error };
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  const logout = async () => {
    return supabase.auth.signOut();
  };

  const mockLogin = (role) => {
    setCurrentUser({ id: 'mock-123', email: 'mock@test.com', name: 'Mock User' });
    setUserRole(role);
  };

  const mockLogout = () => {
    setCurrentUser(null);
    setUserRole(null);
  };

  const value = {
    currentUser,
    userRole,
    loginWithEmail,
    signupWithEmail,
    resetPassword,
    verifyOtp,
    updatePassword,
    logout: currentUser?.id === 'mock-123' ? mockLogout : logout,
    refreshProfile,
    mockLogin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
