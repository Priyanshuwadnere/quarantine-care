import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '../types/user';
import { DEMO_USERS } from '../data/seedData';

interface AuthStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  lastActivity: number;
  login: (username: string, password: string) => { success: boolean; message?: string };
  switchRole: (role: Role) => void;
  logout: () => void;
  updateActivity: () => void;
  checkInactivityTimeout: () => boolean; // returns true if timed out
}

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Default to Nurse for immediate demo friendliness
      currentUser: DEMO_USERS[0],
      isAuthenticated: true,
      lastActivity: Date.now(),

      login: (username: string, password: string) => {
        const trimmedUser = username.trim().toLowerCase();
        const validCredentials: Record<string, string> = {
          nurse: 'nurse123',
          doctor: 'doctor123',
          admin: 'admin123',
          head: 'head123',
        };

        if (validCredentials[trimmedUser] && validCredentials[trimmedUser] === password) {
          const user = DEMO_USERS.find(u => u.username === trimmedUser);
          if (user) {
            set({
              currentUser: user,
              isAuthenticated: true,
              lastActivity: Date.now(),
            });
            return { success: true };
          }
        }

        return {
          success: false,
          message: 'Invalid credentials. Please use the demo credentials provided below.',
        };
      },

      switchRole: (role: Role) => {
        const user = DEMO_USERS.find(u => u.role === role);
        if (user) {
          set({
            currentUser: user,
            isAuthenticated: true,
            lastActivity: Date.now(),
          });
        }
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          lastActivity: Date.now(),
        });
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      checkInactivityTimeout: () => {
        const { lastActivity, isAuthenticated } = get();
        if (isAuthenticated && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
          set({
            currentUser: null,
            isAuthenticated: false,
          });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'quarantine-care-auth-v1',
    }
  )
);
