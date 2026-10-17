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
  // Clear all dummy data
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('biota_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id && parsed.name) return parsed;
        }
      } catch (e) {
        console.error('Error loading current user from localStorage', e);
      }
    }
    return INITIAL_USERS[0];
  });
  
  const [deals, setDeals] = useState<Deal[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('biota_deals');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading deals from localStorage', e);
      }
    }
    return INITIAL_DEALS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('biota_customers');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading customers from localStorage', e);
      }
    }
    return INITIAL_CUSTOMERS;
  });

  const [team, setTeam] = useState<TeamMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('biota_team');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error loading team from localStorage', e);
      }
    }
    return INITIAL_TEAM;
  });
  
  const [target, setTarget] = useState<SalesTargetSetting>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('biota_target');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading target from localStorage', e);
      }
    }
    return INITIAL_TARGET;
  });

  const [logs, setLogs] = useState<AuditLog[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('biota_logs');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading logs from localStorage', e);
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

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

  // Persist state to localStorage for offline / static Vercel hosting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('biota_deals', JSON.stringify(deals));
    }
  }, [deals]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('biota_customers', JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('biota_team', JSON.stringify(team));
    }
  }, [team]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('biota_target', JSON.stringify(target));
    }
  }, [target]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('biota_logs', JSON.stringify(logs));
    }
  }, [logs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('biota_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Synchronize currentUser with team list:
  // If active user profile was edited in team, sync it.
  // If active user was deleted or is not in team (e.g. stale Rian Pratama), fallback to active Super Admin.
  useEffect(() => {
    if (team.length > 0) {
      const activeInTeam = team.find(t => t.id === currentUser.id);
      if (activeInTeam) {
        if (
          activeInTeam.name !== currentUser.name ||
          activeInTeam.role !== currentUser.role ||
          activeInTeam.title !== currentUser.title ||
          activeInTeam.email !== currentUser.email
        ) {
          setCurrentUser({
            id: activeInTeam.id,
            name: activeInTeam.name,
            email: activeInTeam.email,
            role: activeInTeam.role,
            title: activeInTeam.title,
            phone: activeInTeam.phone,
            status: activeInTeam.status,
          });
        }
      } else {
        // Fallback to first Super Admin or first member in team
        const superAdmin = team.find(t => t.role === 'super_admin') || team[0];
        setCurrentUser({
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
          title: superAdmin.title,
          phone: superAdmin.phone,
          status: superAdmin.status,
        });
      }
    }
  }, [team, currentUser.id, currentUser.name, currentUser.role, currentUser.title, currentUser.email]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Sync with backend on initial mount if API is reachable
  useEffect(() => {
    const fetchSafe = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const ct = res.headers.get('content-type');
        if (!ct || !ct.includes('application/json')) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    fetchSafe('/api/deals').then(data => {
      if (data?.success && Array.isArray(data.data)) setDeals(data.data);
    });

    fetchSafe('/api/customers').then(data => {
      if (data?.success && Array.isArray(data.data)) setCustomers(data.data);
    });

    fetchSafe('/api/team').then(data => {
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        setTeam(data.data);
      }
    });

    fetchSafe('/api/settings/target').then(data => {
      if (data?.success && data.data) setTarget(data.data);
    });

    fetchSafe('/api/logs').then(data => {
      if (data?.success && Array.isArray(data.data)) setLogs(data.data);
    });
  }, []);

  // Quick switch role/user for testing and live demonstration
  const switchUser = (roleOrIdOrEmail: string) => {
    let targetMember: TeamMember | undefined;

    // 1. By ID in current team
    targetMember = team.find(t => t.id === roleOrIdOrEmail);

    // 2. By Email in current team
    if (!targetMember) {
      targetMember = team.find(t => t.email.toLowerCase() === roleOrIdOrEmail.toLowerCase());
    }

    // 3. By Role in current team
    if (!targetMember) {
      if (roleOrIdOrEmail === 'super_admin') {
        targetMember = team.find(t => t.role === 'super_admin');
      } else if (roleOrIdOrEmail === 'admin') {
        targetMember = team.find(t => t.role === 'admin') || team.find(t => t.role !== 'super_admin');
      }
    }

    // 4. Fallback to INITIAL_USERS or first member
    const fallback = targetMember || team[0] || INITIAL_USERS[0];

    const newUser: User = {
      id: fallback.id,
      name: fallback.name,
      email: fallback.email,
      role: fallback.role,
      title: fallback.title,
      phone: fallback.phone,
      status: fallback.status,
    };

    setCurrentUser(newUser);

    if (typeof window !== 'undefined') {
      localStorage.setItem('biota_current_user', JSON.stringify(newUser));
    }

    // Log login switch
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      actionCategory: 'AUTH',
      actionType: 'SWITCH_USER',
      description: `Beralih sesi ke ${newUser.name} (${newUser.title} / ${newUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}).`,
    };
    setLogs(prev => [newLog, ...prev]);

    // Call API
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newUser.email }),
    }).catch(() => {});

    showToast(`Aktif sebagai ${newUser.name} (${newUser.title})`, 'info');
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

    const newMember: TeamMember = {
      id: `user_${Date.now()}`,
      name: memberData.name?.trim() || '',
      email: memberData.email?.trim() || '',
      role: memberData.role || 'admin',
      title: memberData.title || (memberData.role === 'super_admin' ? 'Senior Sales Executive' : 'Account Executive'),
      phone: memberData.phone?.trim() || '-',
      status: memberData.status || 'active',
      individualTarget: Number(memberData.individualTarget) || 500_000_000,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setTeam(prev => {
      const updated = [...prev, newMember];
      if (typeof window !== 'undefined') {
        localStorage.setItem('biota_team', JSON.stringify(updated));
      }
      return updated;
    });

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionCategory: 'TEAM',
      actionType: 'CREATE_TEAM',
      description: `${currentUser.name} menambahkan anggota tim baru: ${newMember.name} (${newMember.title})`,
    };
    setLogs(prev => [newLog, ...prev]);

    // Async attempt to persist to backend API
    fetch('/api/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify({ member: memberData, actor: currentUser }),
    }).catch(() => {});

    showToast(`Anggota tim ${newMember.name} berhasil ditambahkan`, 'success');
    return { success: true };
  };

  const updateTeamMember = async (id: string, updates: Partial<TeamMember>): Promise<{ success: boolean; error?: string }> => {
    if (currentUser.role !== 'super_admin') {
      const deniedMsg = 'Akses Ditolak: Hanya Super Admin yang berhak mengedit data tim.';
      showToast(deniedMsg, 'error');
      return { success: false, error: deniedMsg };
    }

    setTeam(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, ...updates } : t));
      if (typeof window !== 'undefined') {
        localStorage.setItem('biota_team', JSON.stringify(updated));
      }
      return updated;
    });

    fetch(`/api/team/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify({ memberUpdates: updates, actor: currentUser }),
    }).catch(() => {});

    showToast('Status anggota tim diperbarui', 'success');
    return { success: true };
  };

  const deleteTeamMember = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser.role !== 'super_admin') {
      const deniedMsg = 'Akses Ditolak: Hanya Super Admin yang berhak menghapus anggota tim!';
      showToast(deniedMsg, 'error');
      return { success: false, error: deniedMsg };
    }

    const memberToDelete = team.find(t => t.id === id);
    if (!memberToDelete) return { success: false, error: 'Anggota tim tidak ditemukan' };

    const superAdmins = team.filter(t => t.role === 'super_admin');
    if (memberToDelete.role === 'super_admin' && superAdmins.length <= 1) {
      const errMsg = 'Tidak dapat menghapus Super Admin terakhir sistem!';
      showToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    setTeam(prev => {
      const updated = prev.filter(t => t.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('biota_team', JSON.stringify(updated));
      }
      return updated;
    });

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      actionCategory: 'TEAM',
      actionType: 'DELETE_TEAM',
      description: `${currentUser.name} menghapus anggota tim: ${memberToDelete.name} (${memberToDelete.title})`,
    };
    setLogs(prev => [newLog, ...prev]);

    fetch(`/api/team/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-name': currentUser.name,
      },
      body: JSON.stringify({ actor: currentUser }),
    }).catch(() => {});

    showToast(`Anggota tim ${memberToDelete.name} berhasil dihapus`, 'success');
    return { success: true };
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

  const clearAllData = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('biota_deals');
        localStorage.removeItem('biota_customers');
        localStorage.removeItem('biota_logs');
      } catch (e) {
        console.error(e);
      }
    }
    setDeals([]);
    setCustomers([]);
    setLogs([]);
    showToast('Seluruh data transaksi dan customer dummy berhasil dibersihkan (Clear)!', 'success');
    fetch('/api/reset-data', { method: 'POST' }).catch(() => {});
  }, [showToast]);

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
        clearAllData,
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
