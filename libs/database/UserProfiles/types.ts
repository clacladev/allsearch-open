export const TABLE_USER_PROFILES = 'user_profiles';

export type UserRole = 'user' | 'admin';

export type UserProfileRow = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};
