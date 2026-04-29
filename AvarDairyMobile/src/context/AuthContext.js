import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'customer', 'staff', 'admin'
  const [loading, setLoading] = useState(true);

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
    };
  }, []);

  const handleSession = async (session) => {
    if (session?.user) {
      // Fetch user profile to get role
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setUserRole(data.role);
        setCurrentUser({ ...session.user, ...data });
      } else {
        // Fallback if no profile yet
        setUserRole('customer');
        setCurrentUser(session.user);
      }
    } else {
      setCurrentUser(null);
      setUserRole(null);
    }
    setLoading(false);
  };

  const loginWithEmail = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signupWithEmail = async (email, password, name, phone) => {
    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    // 2. Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name: name || '',
        phone: phone || '',
        role: 'customer' // default role
      });
    }
    
    return data;
  };

  const logout = async () => {
    return supabase.auth.signOut();
  };

  // Mock login for development bypassing actual auth
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
    logout: currentUser?.id === 'mock-123' ? mockLogout : logout,
    mockLogin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
