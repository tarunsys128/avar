import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'customer', 'staff', 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'Users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          // If no doc exists, they might be a new customer signing up via Phone
          // We will handle doc creation in the phone verify step or here
          if (user.phoneNumber) {
            const newUserData = {
              id: user.uid,
              phone: user.phoneNumber,
              role: 'customer',
              created_at: new Date().toISOString()
            };
            await setDoc(userDocRef, newUserData);
            setUserRole('customer');
            setCurrentUser({ ...user, ...newUserData });
          } else {
             // Fallback
             setUserRole('customer');
             setCurrentUser(user);
          }
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible'
      });
    }
    return window.recaptchaVerifier;
  };

  const loginWithPhone = async (phoneNumber, appVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userRole,
    loginWithEmail,
    setupRecaptcha,
    loginWithPhone,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
