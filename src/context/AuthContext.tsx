'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  TwitterAuthProvider,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getUserProfile, UserProfile } from '../lib/user-profile';
import { notifyUser } from '../lib/notification-service';
import { sendVerificationEmail } from '@/app/actions/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithTwitter: async () => {},
  signInWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    }
  };

  const ensureProfileExists = async (user: User) => {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    // Resolve Email (check providerData if user.email is null)
    let email = user.email;
    if (!email && user.providerData && user.providerData.length > 0) {
        for (const profile of user.providerData) {
            if (profile.email) {
                email = profile.email;
                break;
            }
        }
    }

    // Prepare default values from Provider
    let defaultDisplayName = user.displayName;
    if (!defaultDisplayName && email) {
      defaultDisplayName = email.split('@')[0];
    }

    let defaultPhotoURL = user.photoURL;
    if (!defaultPhotoURL && defaultDisplayName) {
      defaultPhotoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultDisplayName)}&background=random`;
    }

    if (!docSnap.exists()) {
      // Create new profile
      await setDoc(docRef, {
        uid: user.uid,
        email: email,
        displayName: defaultDisplayName || 'Anonymous',
        photoURL: defaultPhotoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPremium: false,
        preferences: {
          emailNotifications: true,
          publicProfile: true,
          showPrices: true,
          reducedMotion: false
        }
      });

      // Send Welcome Notification
      // Pass email explicitly to ensure it sends even if DB read is delayed
      notifyUser(user.uid, 'welcome', undefined, email || undefined).catch(console.error);
    } else {
      // Update existing profile if fields are missing/empty
      const data = docSnap.data();
      const updates: any = {};
      let needsUpdate = false;

      // Only fill if missing in Firestore AND available from Provider/Defaults
      if (!data.photoURL && defaultPhotoURL) {
        updates.photoURL = defaultPhotoURL;
        needsUpdate = true;
      }
      
      if ((!data.displayName || data.displayName === 'Anonymous') && defaultDisplayName) {
        if (!data.displayName) {
             updates.displayName = defaultDisplayName;
             needsUpdate = true;
        }
      }

      // Backfill email if missing in Firestore but available now
      if (!data.email && email) {
        updates.email = email;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await setDoc(docRef, { ...data, ...updates, updatedAt: new Date().toISOString() });
      }
    }
  };

  useEffect(() => {
    // Check for redirect result (e.g. from Twitter login)
    getRedirectResult(auth).catch((error) => {
      console.error("Error getting redirect result", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await ensureProfileExists(user);
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign in popup closed by user");
        throw error;
      }
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithTwitter = async () => {
    const provider = new TwitterAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Twitter", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with Email", error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendVerificationEmail(email);
    } catch (error) {
      console.error("Error registering with Email", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInWithTwitter,
      signInWithEmail,
      registerWithEmail,
      logout, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
