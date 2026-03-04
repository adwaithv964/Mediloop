import { create } from 'zustand';
import { User } from '../types';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { API_URL } from '../config/api';

// ---------------------------------------------------------------------------
// Module-level flag: set to true by AdminLogin BEFORE calling
// signInWithEmailAndPassword so that onAuthStateChanged / initialize() does
// NOT race ahead and set the user from MongoDB (which may have stale role).
// Cleared by AdminLogin right after login(adminUser) is called.
// ---------------------------------------------------------------------------
let _adminLoginInProgress = false;

export const setAdminLoginFlag = (value: boolean) => {
  _adminLoginInProgress = value;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user) => {
    // Persist role so offline/refresh fallback gets the right role
    localStorage.setItem(`mediloop_role_${user.id}`, user.role);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    const { user } = get();
    if (user) localStorage.removeItem(`mediloop_role_${user.id}`);
    await signOut(auth);
    set({ user: null, isAuthenticated: false });
  },


  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  initialize: () => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser?.email) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // If AdminLogin is currently mid-flow (flag set before signInWithEmailAndPassword),
      // skip overwriting state — AdminLogin will call login() with the correct admin user.
      if (_adminLoginInProgress) {
        set({ isLoading: false });
        return;
      }

      // If already authenticated with the same uid (e.g. page-level re-render),
      // just clear the loading flag and don't overwrite the user state.
      const { isAuthenticated, user: currentUser } = get();
      if (isAuthenticated && currentUser?.id === firebaseUser.uid) {
        set({ isLoading: false });
        return;
      }

      try {
        // 1. Try MongoDB first (source of truth for role, name, preferences)
        const res = await fetch(
          `${API_URL}/api/sync/user-by-email?email=${encodeURIComponent(firebaseUser.email)}`
        );

        if (res.ok) {
          const mongoUser: User = await res.json();
          // Safety guard: never downgrade an admin role set by AdminLogin
          if (currentUser?.role === 'admin' && mongoUser.role !== 'admin') {
            mongoUser.role = 'admin';
          }
          set({ user: mongoUser, isAuthenticated: true, isLoading: false });
          return;
        }

        // 2. MongoDB doesn't have the user yet (e.g. just registered, sync pending)
        //    Build a minimal profile from Firebase claims so the app still works
        const token = await firebaseUser.getIdTokenResult();
        const role = (token.claims['role'] as User['role']) || 'patient';

        const fallbackUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          role,
          createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
          updatedAt: new Date(),
          preferences: {
            theme: 'light',
            elderlyMode: false,
            notificationsEnabled: true,
            voiceEnabled: false,
            language: 'en',
          },
        };

        set({ user: fallbackUser, isAuthenticated: true, isLoading: false });
      } catch (error) {
        // Backend unreachable (network error, 500, etc.)
        // Don't log the user out — Firebase session is still valid.
        // Build a minimal profile from Firebase so the app keeps working.
        console.warn('Auth init: backend unreachable, using Firebase fallback', error);
        try {
          const token = await firebaseUser.getIdTokenResult();
          const role = (token.claims['role'] as User['role']) || 'patient';
          const savedRole = localStorage.getItem(`mediloop_role_${firebaseUser.uid}`);
          const resolvedRole = (savedRole as User['role']) || role;

          const offlineFallback: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            role: resolvedRole,
            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            updatedAt: new Date(),
            preferences: {
              theme: 'light',
              elderlyMode: false,
              notificationsEnabled: true,
              voiceEnabled: false,
              language: 'en',
            },
          };
          set({ user: offlineFallback, isAuthenticated: true, isLoading: false });
        } catch {
          // Firebase token fetch also failed — truly sign out
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    });

  },
}));
