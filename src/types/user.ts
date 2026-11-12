export type Role = 'nurse' | 'doctor' | 'admin' | 'head_doctor';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  title: string;
  avatarColor?: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  lastActivity: number;
}
