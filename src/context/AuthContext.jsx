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

// ─── Master / Demo credentials ────────────────────────────────────────────────
// These allow instant login without Firebase being fully configured.
// Change these before going to production!
const MASTER_CREDENTIALS = {
  'admin@avardairy.com':    { password: 'admin@123',    role: 'admin' },
  'staff@avardairy.com':    { password: 'staff@123',    role: 'staff' },
  'customer@avardairy.com': { password: 'customer@123', role: 'customer' },
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'customer' | 'staff' | 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'Users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
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
            setUserRole('customer');
            setCurrentUser(user);
          }
        }
      } else {
        // Check if a master login session is stored
        const masterSession = sessionStorage.getItem('masterUser');
        if (masterSession) {
          const parsed = JSON.parse(masterSession);
          setCurrentUser(parsed);
          setUserRole(parsed.role);
        } else {
          setCurrentUser(null);
          setUserRole(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ── Standard Firebase auth ─────────────────────────────────────────────────
  const loginWithEmail = async (email, password) => {
    // First check master credentials so the app works without Firebase configured
    const masterEntry = MASTER_CREDENTIALS[email.toLowerCase()];
    if (masterEntry && masterEntry.password === password) {
      return masterLogin(email, password, masterEntry.role);
    }
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

  // ── Master Login (demo / bypass) ──────────────────────────────────────────
  const masterLogin = async (email, password, role) => {
    const key = email.toLowerCase();
    const master = MASTER_CREDENTIALS[key];

    if (!master || master.password !== password) {
      throw new Error('Invalid master credentials');
    }

    const fakeUser = {
      uid: `master_${role}`,
      email,
      role,
      displayName: role.charAt(0).toUpperCase() + role.slice(1) + ' (Demo)',
      isMaster: true,
      created_at: new Date().toISOString(),
    };

    sessionStorage.setItem('masterUser', JSON.stringify(fakeUser));
    setCurrentUser(fakeUser);
    setUserRole(role);
    return fakeUser;
  };

  const logout = async () => {
    sessionStorage.removeItem('masterUser');
    setCurrentUser(null);
    setUserRole(null);
    try {
      await signOut(auth);
    } catch (_) {
      // Ignore if not signed in via Firebase
    }
  };

  const value = {
    currentUser,
    userRole,
    loginWithEmail,
    setupRecaptcha,
    loginWithPhone,
    masterLogin,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
