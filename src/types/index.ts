export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  section: string;
  role: 'member' | 'admin' | 'head_admin';
  points: number;
  created_at: string;
}

export interface Section {
  id: string;
  name: string;
  total_points: number;
  member_count: number;
  icon: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  admin_id: string;
  points: number;
  reason: string;
  created_at: string;
}