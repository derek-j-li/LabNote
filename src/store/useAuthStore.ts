import { create } from 'zustand';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

// Allowed email addresses (only these users can access the app)
const ALLOWED_EMAILS = ['derekli.thu@gmail.com'];

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAllowed: boolean;

  initialize: () => () => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,
  isAllowed: false,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const allowed = ALLOWED_EMAILS.includes(user.email || '');
        if (!allowed) {
          signOut(auth);
          set({
            user: null,
            loading: false,
            error: `Access denied for ${user.email}. This app is restricted.`,
            isAllowed: false,
          });
        } else {
          set({ user, loading: false, error: null, isAllowed: true });
        }
      } else {
        set({ user: null, loading: false, error: null, isAllowed: false });
      }
    });
    return unsubscribe;
  },

  signInWithGoogle: async () => {
    try {
      set({ error: null });
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      set({ error: message });
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, isAllowed: false });
  },
}));
