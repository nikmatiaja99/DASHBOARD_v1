export type UserRole = 'super_admin' | 'admin';

export type JobTitle = 'Senior Sales Executive' | 'Account Executive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: JobTitle;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

export type DealStage = 'lead_in' | 'follow_up' | 'proposal' | 'won' | 'lost';

export const DEAL_STAGES: { id: DealStage; label: string; color: string; bg: string }[] = [
  { id: 'lead_in', label: 'Lead In', color: '#3B82F6', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'follow_up', label: 'Follow Up', color: '#F59E0B', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'proposal', label: 'Proposal', color: '#8B5CF6', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'won', label: 'Won', color: '#10B981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'lost', label: 'Lost', color: '#EF4444', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const LOST_REASONS = [
  'Budget tidak sesuai',
  'Kalah dengan kompetitor',
  'Proyek ditunda / dibatalkan',
  'Klien tidak responsif (Ghosted)',
  'Spesifikasi smart home tidak cocok',
  'Lainnya',
] as const;

export type LostReason = typeof LOST_REASONS[number];

export interface Deal {
  id: string;
  code: string; // e.g. "D-101"
  title: string; // e.g. "Cluster Emerald Smart Villa - 12 Units"
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  value: number; // in IDR Rupiah
  stage: DealStage;
  picId: string;
  picName: string;
  notes?: string;
  lostReason?: LostReason | string;
  lostNotes?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  expectedCloseDate?: string;
}

export interface Customer {
  id: string;
  code: string; // e.g. "CUST-001"
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export type TeamStatus = 'active' | 'leave' | 'inactive';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: JobTitle;
  phone: string;
  status: TeamStatus;
  individualTarget: number; // in IDR Rupiah
  joinedDate: string;
}

export type ActionCategory = 'AUTH' | 'DEAL' | 'CUSTOMER' | 'TEAM' | 'SETTING' | 'SYSTEM';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  actionCategory: ActionCategory;
  actionType: string;
  description: string;
  details?: Record<string, any>;
}

export interface SalesTargetSetting {
  monthlyTarget: number; // e.g. 2500000000 (2.5 Miliar)
  quarterlyTarget: number;
  yearlyTarget: number;
  periodName: string; // e.g. "Oktober 2026"
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export type FilterPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
