import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  User,
  Deal,
  Customer,
  TeamMember,
  SalesTargetSetting,
  AuditLog,
  DealStage,
  LostReason,
} from '../types/index';
import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_TEAM,
  INITIAL_DEALS,
  INITIAL_TARGET,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';
import { runSystemIntegrityCheck } from '../utils/salesLogic';

interface AppContextType {
  currentUser: User;
  switchUser: (roleOrEmail: string) => void;
  deals: Deal[];
  customers: Customer[];
  team: TeamMember[];
  target: SalesTargetSetting;
  logs: AuditLog[];
  activeTab: 'overview' | 'pipeline' | 'customers' | 'analytics' | 'team' | 'logs';
  setActiveTab: (tab: 'overview' | 'pipeline' | 'customers' | 'analytics' | 'team' | 'logs') => void;
  // Deals actions
  createDeal: (dealData: Partial<Deal>) => Promise<{ success: boolean; error?: string }>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<{ success: boolean; error?: string }>;
  updateDealStage: (id: string, stage: DealStage, lostReason?: string, lostNotes?: string) => Promise<{ success: boolean; error?: string }>;
  deleteDeal: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Customer actions
  createCustomer: (customerData: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Team actions
  createTeamMember: (memberData: Partial<TeamMember>) => Promise<{ success: boolean; error?: string }>;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => Promise<{ success: boolean; error?: string }>;
  deleteTeamMember: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Target action
  updateTarget: (monthlyTarget: number) => Promise<{ success: boolean; error?: string }>;
  // Lost Reason Modal State
  pendingLostDeal: Deal | null;
  setPendingLostDeal: (deal: Deal | null) => void;
  // System Checker State
  isCheckerOpen: boolean;
  setIsCheckerOpen: (open: boolean) => void;
  runAutoCheck: () => Promise<any>;
  lastCheckResult: any;
  // Toast notifications
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  // Theme state (Light / Dark)
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default Fitroh Adhiansyah (Senior Sales Executive / Super Admin)
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [target, setTarget] = useState<SalesTargetSetting>(INITIAL_TARGET);
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'customers' | 'analytics' | 'team' | 'logs'>('overview');
  const [pendingLostDeal, setPendingLostDeal] = useState<Deal | null>(null);
  const [isCheckerOpen, setIsCheckerOpen] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('biota_theme') as 'light' | 'dark' | null;
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('biota_theme', theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Sync with backend on initial mount
  useEffect(() => {
    fetch('/api/deals')
      .then(res => res.json())
      .then(data => { if (data.success) setDeals(data.data); })
      .catch(() => {});

    fetch('/api/customers')
      .then(res => res.json())
      .then(data => { if (data.success) setCustomers(data.data); })
      .catch(() => {});

    fetch('/api/team')
      .then(res => res.json())
      .then(data => { if (data.success) setTeam(data.data); })
      .catch(() => {});

    fetch('/api/settings/target')
      .then(res => res.json())
      .then(data => { if (data.success) setTarget(data.data); })
      .catch(() => {});

    fetch('/api/logs')
      .then(res => res.json())
      .then(data => { if (data.success) setLogs(data.data); })
      .catch(() => {});
  }, []);

  // Quick switch role/user for testing and live demonstration
  const switchUser = (roleOrEmail: string) => {
    let targetUser: User | undefined;
    if (roleOrEmail === 'super_admin') {
      targetUser = INITIAL_USERS.find(u => u.role === 'super_admin');
    } else if (roleOrEmail === 'admin') {
      targetUser = INITIAL_USERS.find(u => u.role === 'admin');
    } else {
      targetUser = INITIAL_USERS.find(u => u.email === roleOrEmail || u.id === roleOrEmail);
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      // Log login switch
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.role,
        actionCategory: 'AUTH',
        actionType: 'SWITCH_USER',
        description: `Beralih sesi ke ${targetUser.name} (${targetUser.title} / ${targetUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}).`,
      };
      setLogs(prev => [newLog, ...prev]);

      // Call API
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetUser.email }),
      }).catch(() => {});

      showToast(`Aktif sebagai ${targetUser.name} (${targetUser.title})`, 'info');
    }
  };

  // DEAL ACTIONS
  const createDeal = async (dealData: Partial<Deal>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal: dealData, actor: currentUser }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        const errMsg = resData.errors ? Object.values(resData.errors)[0] as string : resData.message || 'Gagal membuat deal';
        showToast(errMsg, 'error');
        return { success: false, error: errMsg };
      }

      setDeals(prev => [resData.data, ...prev]);
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionCategory: 'DEAL',
        actionType: 'CREATE_DEAL',
        description: `${currentUser.name} menambahkan deal baru: ${resData.data.code} - ${resData.data.title}`,
      };
      setLogs(prev => [newLog, ...prev]);
      showToast(`Deal ${resData.data.code} berhasil ditambahkan`, 'success');
      return { success: true };
    } catch {
      // Local fallback
      const nextNum = deals.length + 101;
      const newDeal: Deal = {
        id: `deal_${Date.now()}`,
        code: `D-${nextNum}`,
        title: dealData.title || '',
        customerId: dealData.customerId || '',
        customerName: dealData.customerName || '',
        customerPhone: dealData.customerPhone,
        customerEmail: dealData.customerEmail,
        value: Number(dealData.value) || 0,
        stage: dealData.stage || 'lead_in',
        picId: dealData.picId || currentUser.id,
        picName: dealData.picName || currentUser.name,
        notes: dealData.notes || '',
        lostReason: dealData.lostReason,
        lostNotes: dealData.lostNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDeals(prev => [newDeal, ...prev]);
      showToast(`Deal ${newDeal.code} berhasil ditambahkan`, 'success');
      return { success: true };
    }
  };

  const updateDeal = async (id: string, updates: Partial<Deal>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealUpdates: updates, actor: currentUser }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        const errMsg = resData.errors ? Object.values(resData.errors)[0] as string : resData.message || 'Gagal update deal';
        showToast(errMsg, 'error');
        return { success: false, error: errMsg };
      }

      setDeals(prev => prev.map(d => (d.id === id ? resData.data : d)));
      showToast('Data deal berhasil diperbarui', 'success');
      return { success: true };
    } catch {
      setDeals(prev => prev.map(d => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)));
      showToast('Data deal diperbarui', 'success');
      return { success: true };
    }
  };

  const updateDealStage = async (id: string, stage: DealStage, lostReason?: string, lostNotes?: string) => {
    const deal = deals.find(d => d.id === id);
    if (!deal) return { success: false, error: 'Deal tidak ditemukan' };

    // If moving to lost, reason is mandatory!
    if (stage === 'lost' && !lostReason) {
      setPendingLostDeal(deal);
      return { success: false, error: 'Alasan Lost wajib diisi' };
    }

    const updates: Partial<Deal> = {
      stage,
      lostReason: stage === 'lost' ? (lostReason as LostReason) : undefined,
      lostNotes: stage === 'lost' ? lostNotes : undefined,
    };

    const res = await updateDeal(id, updates);
    if (res.success) {
      const desc = stage === 'lost'
        ? `${currentUser.name} memindahkan deal ${deal.code} ke LOST (Alasan: ${lostReason})`
        : stage === 'won'
        ? `${currentUser.name} menandai deal ${deal.code} sebagai WON (Omset: Rp ${deal.value.toLocaleString('id-ID')})`
        : `${currentUser.name} memindahkan deal ${deal.code} ke ${stage.toUpperCase()}`;

      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionCategory: 'DEAL',
        actionType: 'UPDATE_STAGE',
        description: desc,
      };
      setLogs(prev => [newLog, ...prev]);
    }
    return res;
  };

  const deleteDeal = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const targetDeal = deals.find(d => d.id === id);
    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: currentUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal menghapus deal', 'error');
        return { success: false, error: data.message };
      }
      setDeals(prev => prev.filter(d => d.id !== id));
      if (targetDeal) {
        const newLog: AuditLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          actionCategory: 'DEAL',
          actionType: 'DELETE_DEAL',
          description: `${currentUser.name} menghapus deal ${targetDeal.code} - ${targetDeal.title}`,
        };
        setLogs(prev => [newLog, ...prev]);
      }
      showToast('Deal berhasil dihapus', 'success');
      return { success: true };
    } catch {
      setDeals(prev => prev.filter(d => d.id !== id));
      showToast('Deal dihapus', 'success');
      return { success: true };
    }
  };

  // CUSTOMER ACTIONS
  const createCustomer = async (customerData: Partial<Customer>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: customerData, actor: currentUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data.errors ? Object.values(data.errors)[0] as string : data.message || 'Gagal menambahkan customer';
        showToast(errMsg, 'error');
        return { success: false, error: errMsg };
      }

      setCustomers(prev => [data.data, ...prev]);
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionCategory: 'CUSTOMER',
        actionType: 'CREATE_CUSTOMER',
        description: `${currentUser.name} menambahkan customer baru: ${data.data.name}`,
      };
      setLogs(prev => [newLog, ...prev]);
      showToast(`Customer ${data.data.name} berhasil ditambahkan`, 'success');
      return { success: true };
    } catch {
      const nextNum = customers.length + 1;
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        code: customerData.code || `CUST-00${nextNum}`,
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        address: customerData.address || '',
        notes: customerData.notes || '',
        createdAt: new Date().toISOString(),
      };
      setCustomers(prev => [newCust, ...prev]);
      showToast(`Customer ${newCust.name} ditambahkan`, 'success');
      return { success: true };
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerUpdates: updates, actor: currentUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal update customer', 'error');
        return { success: false, error: data.message };
      }

      setCustomers(prev => prev.map(c => (c.id === id ? data.data : c)));
      showToast('Data customer berhasil diperbarui', 'success');
      return { success: true };
    } catch {
      setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
      showToast('Data customer diperbarui', 'success');
      return { success: true };
    }
  };

  // Hapus Customer HANYA BISA SUPER ADMIN
  const deleteCustomer = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser.role !== 'super_admin') {
      const deniedMsg = 'Akses Ditolak: Hanya Super Admin (Senior Sales Executive) yang berhak menghapus data customer!';
      showToast(deniedMsg, 'error');
      return { success: false, error: deniedMsg };
    }

    const targetCust = customers.find(c => c.id === id);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
        },
        body: JSON.stringify({ actor: currentUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal menghapus customer', 'error');
        return { success: false, error: data.message };
      }

      setCustomers(prev => prev.filter(c => c.id !== id));
      if (targetCust) {
        const newLog: AuditLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          actionCategory: 'CUSTOMER',
          actionType: 'DELETE_CUSTOMER',
          description: `${currentUser.name} (Super Admin) menghapus customer: ${targetCust.name}`,
        };
        setLogs(prev => [newLog, ...prev]);
      }
      showToast('Customer berhasil dihapus', 'success');
      return { success: true };
    } catch {
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast('Customer dihapus', 'success');
      return { success: true };
    }
  };

  // TEAM ACTIONS
  const createTeamMember = async (memberData: Partial<TeamMember>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser.role !== 'super_admin') {
      const deniedMsg = 'Akses Ditolak: Hanya Super Admin yang berhak menambahkan tim baru.';
      showToast(deniedMsg, 'error');
      return { success: false, error: deniedMsg };
    }

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({ member: memberData, actor: currentUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const errMsg = data.errors ? Object.values(data.errors)[0] as string : data.message || 'Gagal menambah tim';
        showToast(errMsg, 'error');
        return { success: false, error: errMsg };
      }

      setTeam(prev => [...prev, data.data]);
      showToast(`Anggota tim ${data.data.name} berhasil ditambahkan`, 'success');
      return { success: true };
    } catch {
      const newMember: TeamMember = {
        id: `user_${Date.now()}`,
        name: memberData.name || '',
        email: memberData.email || '',
        role: memberData.role || 'admin',
        title: memberData.title || (memberData.role === 'super_admin' ? 'Senior Sales Executive' : 'Account Executive'),
        phone: memberData.phone || '-',
        status: memberData.status || 'active',
        individualTarget: Number(memberData.individualTarget) || 500_000_000,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      setTeam(prev => [...prev, newMember]);
      showToast(`Anggota tim ${newMember.name} ditambahkan`, 'success');
      return { success: true };
    }
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser.role !== 'super_admin') {
      const deniedMsg = 'Akses Ditolak: Hanya Super Admin yang berhak mengedit data tim.';
      showToast(deniedMsg, 'error');
      return { success: false, error: deniedMsg };
    }

    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({ memberUpdates: updates, actor: currentUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal update status tim', 'error');
        return { success: false, error: data.message };
      }

      setTeam(prev => prev.map(t => (t.id === id ? data.data : t)));
      showToast('Status anggota tim diperbarui', 'success');
      return { success: true };
    } catch {
      setTeam(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
      showToast('Data tim diperbarui', 'success');
      return { success: true };
    }
  };

  const deleteTeamMember = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser.role !== 'super_admin') {
      const deniedMsg = 'Akses Ditolak: Hanya Super Admin yang berhak menghapus anggota tim!';
      showToast(deniedMsg, 'error');
      return { success: false, error: deniedMsg };
    }

    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
        },
        body: JSON.stringify({ actor: currentUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal menghapus anggota tim', 'error');
        return { success: false, error: data.message };
      }

      setTeam(prev => prev.filter(t => t.id !== id));
      showToast('Anggota tim berhasil dihapus', 'success');
      return { success: true };
    } catch {
      setTeam(prev => prev.filter(t => t.id !== id));
      showToast('Anggota tim dihapus', 'success');
      return { success: true };
    }
  };

  // TARGET ACTION (Super Admin only)
  const updateTarget = async (monthlyTarget: number): Promise<{ success: boolean; error?: string }> => {
    if (currentUser.role !== 'super_admin') {
      const deniedMsg = 'Akses Ditolak: Hanya Super Admin yang berhak mengubah target sales!';
      showToast(deniedMsg, 'error');
      return { success: false, error: deniedMsg };
    }

    try {
      const res = await fetch('/api/settings/target', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({ targetUpdates: { monthlyTarget }, actor: currentUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Gagal update target', 'error');
        return { success: false, error: data.message };
      }

      setTarget(data.data);
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionCategory: 'SETTING',
        actionType: 'UPDATE_TARGET',
        description: `${currentUser.name} mengubah Target Sales Bulanan menjadi Rp ${monthlyTarget.toLocaleString('id-ID')}`,
      };
      setLogs(prev => [newLog, ...prev]);
      showToast('Target sales berhasil diperbarui', 'success');
      return { success: true };
    } catch {
      setTarget(prev => ({
        ...prev,
        monthlyTarget,
        quarterlyTarget: monthlyTarget * 3,
        yearlyTarget: monthlyTarget * 12,
        lastUpdatedBy: currentUser.name,
        lastUpdatedAt: new Date().toISOString(),
      }));
      showToast('Target sales diperbarui', 'success');
      return { success: true };
    }
  };

  // Run System Auto-Check
  const runAutoCheck = async () => {
    try {
      const res = await fetch('/api/autocheck');
      const data = await res.json();
      if (data.success) {
        setLastCheckResult(data.report);
        return data.report;
      }
    } catch {
      // Local fallback execution
    }
    const report = runSystemIntegrityCheck({
      deals,
      customers,
      team,
      target,
      logs,
    });
    setLastCheckResult(report);
    return report;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUser,
        deals,
        customers,
        team,
        target,
        logs,
        activeTab,
        setActiveTab,
        createDeal,
        updateDeal,
        updateDealStage,
        deleteDeal,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        createTeamMember,
        updateTeamMember,
        deleteTeamMember,
        updateTarget,
        pendingLostDeal,
        setPendingLostDeal,
        isCheckerOpen,
        setIsCheckerOpen,
        runAutoCheck,
        lastCheckResult,
        toast,
        showToast,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
