import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, signIn, signUp, signOutUser, signInWithGoogle, signInWithGoogleNative, type UserRole, type AppUser } from '../config/auth';
import { database } from '../config/firebase';

interface AuthContextType {
  user: AppUser | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  googleLogin: (role?: UserRole) => Promise<void>;
  googleLoginNative: (idToken: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes (persists login across restarts)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch role from database
          const snapshot = await get(ref(database, `users/${firebaseUser.uid}`));
          const data = snapshot.val();

          if (data && data.role) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: data.role,
            });
          } else {
            // User exists in Auth but not in DB — edge case
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const appUser = await signIn(email, password);
    setUser(appUser);
  };

  const signup = async (email: string, password: string, role: UserRole) => {
    const appUser = await signUp(email, password, role);
    setUser(appUser);
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  const googleLogin = async (role?: UserRole) => {
    const appUser = await signInWithGoogle(role);
    setUser(appUser);
  };

  const googleLoginNative = async (idToken: string, role?: UserRole) => {
    const appUser = await signInWithGoogleNative(idToken, role);
    setUser(appUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        login,
        signup,
        googleLogin,
        googleLoginNative,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
