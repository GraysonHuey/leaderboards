import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStateStable, setAuthStateStable] = useState(false);

  useEffect(() => {
    let authStateTimeout: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear any existing timeout
      if (authStateTimeout) {
        clearTimeout(authStateTimeout);
      }
      
      // Set a small delay to ensure auth state is stable
      authStateTimeout = setTimeout(async () => {
        setFirebaseUser(firebaseUser);
        setAuthStateStable(true);
        
        if (firebaseUser) {
          await setupUserListener(firebaseUser);
        } else {
          setUser(null);
          setLoading(false);
        }
      }, 100);
    });

    return () => {
      unsubscribe();
      if (authStateTimeout) {
        clearTimeout(authStateTimeout);
      }
    };
  }, []);

  const setupUserListener = async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      // First check if user exists, create if not
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user profile if doesn't exist
        const newUser = {
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email || '',
          avatar_url: firebaseUser.photoURL,
          section: 'unassigned',
          role: 'member' as const,
          points: 0,
          created_at: serverTimestamp(),
        };

        await setDoc(userDocRef, newUser);
      }

      // Set up real-time listener for user document changes
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          
          // Additional verification: ensure the Firebase user ID matches
          if (firebaseUser.uid === doc.id) {
            setUser({
              id: firebaseUser.uid,
              email: userData.email,
              name: userData.name,
              avatar_url: userData.avatar_url,
              section: userData.section,
              role: userData.role,
              points: userData.points,
              created_at: userData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            });
          } else {
            console.warn('Auth state mismatch detected, signing out for security');
            firebaseSignOut(auth);
          }
        }
        setLoading(false);
      }, (error) => {
        console.error('Error listening to user document:', error);
        setLoading(false);
      });

      // Store the unsubscribe function to clean up later
      return unsubscribeUser;
    } catch (error) {
      console.error('Error setting up user listener:', error);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Force account selection to avoid confusion with multiple accounts
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Clear any cached user state
      setUser(null);
      setFirebaseUser(null);
      setAuthStateStable(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading: loading || !authStateStable,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};