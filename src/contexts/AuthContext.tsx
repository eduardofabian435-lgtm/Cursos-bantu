import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../services/db';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isMasterAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isTeacher: false,
  isMasterAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (authUser) {
        const userRef = doc(db, 'users', authUser.uid);
        
        try {
          const docSnap = await getDoc(userRef);
          const isAdminEmail = authUser.email?.toLowerCase() === 'eduardofabian435@gmail.com';

          if (!docSnap.exists()) {
            const newProfile: Partial<UserProfile> = {
              uid: authUser.uid,
              name: authUser.displayName || 'Usuário',
              email: authUser.email || '',
              photoURL: authUser.photoURL || undefined,
              role: isAdminEmail ? 'admin' : 'student',
            };
            await setDoc(userRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            const existing = docSnap.data();
            const updates: any = {};
            if (isAdminEmail && existing.role !== 'admin') {
              updates.role = 'admin';
            }
            if (authUser.photoURL && existing.photoURL !== authUser.photoURL) {
              updates.photoURL = authUser.photoURL;
            }
            if (authUser.displayName && existing.name !== authUser.displayName) {
              updates.name = authUser.displayName;
            }
            if (Object.keys(updates).length > 0) {
              await setDoc(userRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
            }
          }

          unsubProfile = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              setProfile({ uid: doc.id, ...doc.data() } as UserProfile);
            }
            setLoading(false);
          }, (error) => {
            console.warn("Profile snapshot error (Quota?):", error);
            // Fallback
            setProfile({
              uid: authUser.uid,
              name: authUser.displayName || 'Usuário',
              email: authUser.email || '',
              role: isAdminEmail ? 'admin' : 'student',
              photoURL: authUser.photoURL || undefined
            } as UserProfile);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error loading profile:", error);
          const isAdminEmail = authUser.email?.toLowerCase() === 'eduardofabian435@gmail.com';
          setProfile({
            uid: authUser.uid,
            name: authUser.displayName || 'Usuário',
            email: authUser.email || '',
            role: isAdminEmail ? 'admin' : 'student',
            photoURL: authUser.photoURL || undefined
          } as UserProfile);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: !!(user?.email && user.email.toLowerCase() === 'eduardofabian435@gmail.com') || profile?.role === 'admin',
    isTeacher: profile?.role === 'teacher',
    isMasterAdmin: !!(user?.email && user.email.toLowerCase() === 'eduardofabian435@gmail.com'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
