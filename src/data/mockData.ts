import type { User, Deal, Customer, TeamMember, SalesTargetSetting, AuditLog } from '../types/index.ts';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_super_admin_1',
    name: 'Fitroh Adhiansyah',
    email: 'fitrohadhiansyah1@gmail.com',
    role: 'super_admin',
    title: 'Senior Sales Executive',
    phone: '0812-8899-1020',
    status: 'active',
  },
  {
    id: 'user_admin_1',
    name: 'Rian Pratama',
    email: 'rian.pratama@biotasmarthome.com',
    role: 'admin',
    title: 'Account Executive',
    phone: '0819-5566-7788',
    status: 'active',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'user_super_admin_1',
    name: 'Fitroh Adhiansyah',
    email: 'fitrohadhiansyah1@gmail.com',
    role: 'super_admin',
    title: 'Senior Sales Executive',
    phone: '0812-8899-1020',
    status: 'active',
    individualTarget: 1_000_000_000,
    joinedDate: '2024-03-01',
  },
  {
    id: 'user_admin_1',
    name: 'Rian Pratama',
    email: 'rian.pratama@biotasmarthome.com',
    role: 'admin',
    title: 'Account Executive',
    phone: '0819-5566-7788',
    status: 'active',
    individualTarget: 500_000_000,
    joinedDate: '2025-02-01',
  },
];

export const INITIAL_DEALS: Deal[] = [];

export const INITIAL_TARGET: SalesTargetSetting = {
  monthlyTarget: 1_000_000_000,
  quarterlyTarget: 3_000_000_000,
  yearlyTarget: 12_000_000_000,
  periodName: 'Oktober 2026',
  lastUpdatedBy: 'Fitroh Adhiansyah (Senior Sales Executive)',
  lastUpdatedAt: new Date().toISOString(),
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_init',
    timestamp: new Date().toISOString(),
    userId: 'user_super_admin_1',
    userName: 'Fitroh Adhiansyah',
    userRole: 'super_admin',
    actionCategory: 'SYSTEM',
    actionType: 'SYSTEM_READY',
    description: 'Sistem BIOTA Smarthome Sales Project Dashboard siap digunakan.',
  },
];
