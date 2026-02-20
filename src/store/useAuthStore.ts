import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  initialize: () => () => void; // Returns unsubscribe function
}

import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from '../db';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start loading by default
      login: (user) => set({ user, isAuthenticated: true }),
      logout: async () => {
        await signOut(auth);
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      initialize: () => {
        return onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Check if user exists in local DB (or backend in real app)
            // For this hybrid approach, we'll try to find the user by email
            try {
              const user = await db.users.where('email').equals(firebaseUser.email!).first();
              if (user) {
                set({ user, isAuthenticated: true, isLoading: false });
              } else {
                // User authenticated in Firebase but not in local DB (new registration potentially)
                // We'll handle this in the Register component, or here if we want auto-creation
                set({ isLoading: false });
              }
            } catch (error) {
              console.error("Error fetching user details:", error);
              set({ isLoading: false });
            }
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
