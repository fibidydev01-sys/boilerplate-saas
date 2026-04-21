import { create } from "zustand";
import { createClient } from "@/core/lib/supabase/client";
import { isAdminRole } from "@/config";
import { fetchActiveProfile } from "@/core/auth/services";
import type { UserProfile } from "@/core/types";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasFetched: boolean;
  fetchPromise: Promise<void> | null;

  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  hasFetched: false,
  fetchPromise: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  fetchUser: async () => {
    const state = get();

    if (state.hasFetched && state.user) return;
    if (state.fetchPromise) return state.fetchPromise;
    if (state.isLoading) return;

    const supabase = createClient();

    const promise = (async () => {
      try {
        set({ isLoading: true });

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          set({
            ...initialState,
            hasFetched: true,
          });
          return;
        }

        // Delegate DB call ke profile service — store cuma handle state.
        const { profile, error } = await fetchActiveProfile(
          supabase,
          session.user.id
        );

        if (error || !profile) {
          set({
            ...initialState,
            hasFetched: true,
          });
          return;
        }

        set({
          user: profile,
          isAuthenticated: true,
          isAdmin: isAdminRole(profile.role),
          isLoading: false,
          hasFetched: true,
          fetchPromise: null,
        });
      } catch (err) {
        console.error("fetchUser error:", err);
        set({
          ...initialState,
          hasFetched: true,
        });
      }
    })();

    // Set promise SEBELUM async resolve — fix race condition
    set({ fetchPromise: promise });
    return promise;
  },

  logout: async () => {
    const supabase = createClient();

    // Clear state dulu, baru signOut
    set({ ...initialState });

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
  },

  reset: () => set({ ...initialState }),
}));
