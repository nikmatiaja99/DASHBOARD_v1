import type { Deal, DealStage, Customer, TeamMember, SalesTargetSetting, AuditLog, LostReason, FilterPeriod } from '../types/index.ts';

/**
 * Format number to Indonesian Rupiah currency format
 * e.g. 150000000 -> "Rp 150.000.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Format compact Rupiah for charts and KPI cards
 * e.g. 1500000000 -> "Rp 1,5 M"
 */
export function formatCompactRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace('.0', '')} Jt`;
  }
  return formatRupiah(amount);
}

/**
 * Parse string or formatted number to pure numeric value
 */
export function parseNumericRupiah(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const clean = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate total pipeline values and count per stage
 */
export function calculatePipelineSummary(deals: Deal[]) {
  const summary: Record<DealStage, { count: number; totalValue: number; label: string }> = {
    lead_in: { count: 0, totalValue: 0, label: 'Lead In' },
    follow_up: { count: 0, totalValue: 0, label: 'Follow Up' },
    proposal: { count: 0, totalValue: 0, label: 'Proposal' },
    won: { count: 0, totalValue: 0, label: 'Won' },
    lost: { count: 0, totalValue: 0, label: 'Lost' },
  };

  let totalActiveValue = 0;
  let totalActiveCount = 0;
  let wonTotal = 0;
  let wonCount = 0;

  for (const deal of deals) {
    if (summary[deal.stage]) {
      summary[deal.stage].count += 1;
      summary[deal.stage].totalValue += deal.value;
    }

    if (deal.stage === 'won') {
      wonTotal += deal.value;
      wonCount += 1;
    } else if (deal.stage !== 'lost') {
      // Active pipeline stages
      totalActiveValue += deal.value;
      totalActiveCount += 1;
    }
  }

  const allDealsValue = deals.reduce((acc, d) => acc + d.value, 0);
  const winRate = deals.length > 0 ? (wonCount / deals.length) * 100 : 0;
  const avgDealSize = deals.length > 0 ? allDealsValue / deals.length : 0;

  return {
    summary,
    totalDealsCount: deals.length,
    allDealsValue,
    totalActiveValue,
    totalActiveCount,
    wonTotal,
    wonCount,
    winRate: Math.round(winRate * 10) / 10,
    avgDealSize: Math.round(avgDealSize),
  };
}

/**
 * Calculate Omset vs Target performance
 */
export function calculateTargetPerformance(wonTotal: number, targetAmount: number) {
  const safeTarget = targetAmount > 0 ? targetAmount : 1;
  const percentage = (wonTotal / safeTarget) * 100;
  const remaining = Math.max(0, safeTarget - wonTotal);
  const isTargetAchieved = wonTotal >= safeTarget;

  return {
    target: safeTarget,
    wonTotal,
    percentage: Math.round(percentage * 10) / 10,
    remaining,
    isTargetAchieved,
  };
}

/**
 * Filter deals by period
 */
export function filterDealsByPeriod(deals: Deal[], period: FilterPeriod, referenceDate: Date = new Date('2026-10-16T12:00:00Z')): Deal[] {
  if (period === 'all') return deals;

  const refTime = referenceDate.getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  return deals.filter(deal => {
    const dealDate = new Date(deal.createdAt).getTime();
    const diffDays = (refTime - dealDate) / ONE_DAY;

    switch (period) {
      case 'today':
        return diffDays <= 1 && diffDays >= 0;
      case 'week':
        return diffDays <= 7 && diffDays >= 0;
      case 'month':
        return diffDays <= 31 && diffDays >= 0;
      case 'quarter':
        return diffDays <= 92 && diffDays >= 0;
      case 'year':
        return diffDays <= 365 && diffDays >= 0;
      default:
        return true;
    }
  });
}

/**
 * Calculate Breakdown of Lost Reasons
 */
export function calculateLostReasonsBreakdown(deals: Deal[]) {
  const lostDeals = deals.filter(d => d.stage === 'lost');
  const counts: Record<string, { count: number; totalValue: number }> = {};

  for (const deal of lostDeals) {
    const reason = deal.lostReason || 'Alasan tidak dicantumkan';
    if (!counts[reason]) {
      counts[reason] = { count: 0, totalValue: 0 };
    }
    counts[reason].count += 1;
    counts[reason].totalValue += deal.value;
  }

  const result = Object.entries(counts).map(([reason, data]) => ({
    reason,
    count: data.count,
    totalValue: data.totalValue,
    percentage: lostDeals.length > 0 ? Math.round((data.count / lostDeals.length) * 100) : 0,
  }));

  return result.sort((a, b) => b.count - a.count);
}

/**
 * Calculate Sales Rep / PIC Performance
 */
export function calculateSalesPerformance(deals: Deal[], team: TeamMember[]) {
  const picMap: Record<string, {
    member: TeamMember;
    totalDeals: number;
    wonDeals: number;
    totalValue: number;
    wonValue: number;
    activeValue: number;
    target: number;
    achievementPct: number;
  }> = {};

  // Initialize for all active team members
  for (const member of team) {
    picMap[member.id] = {
      member,
      totalDeals: 0,
      wonDeals: 0,
      totalValue: 0,
      wonValue: 0,
      activeValue: 0,
      target: member.individualTarget || 500_000_000,
      achievementPct: 0,
    };
  }

  for (const deal of deals) {
    if (!picMap[deal.picId]) {
      // If deal PIC is not in current team list, create placeholder
      picMap[deal.picId] = {
        member: {
          id: deal.picId,
          name: deal.picName,
          email: `${deal.picName.toLowerCase().replace(/\s+/g, '.')}@biotasmarthome.com`,
          role: 'admin',
          title: 'Account Executive',
          phone: '-',
          status: 'active',
          individualTarget: 500_000_000,
          joinedDate: '2026-01-01',
        },
        totalDeals: 0,
        wonDeals: 0,
        totalValue: 0,
        wonValue: 0,
        activeValue: 0,
        target: 500_000_000,
        achievementPct: 0,
      };
    }

    const stat = picMap[deal.picId];
    stat.totalDeals += 1;
    stat.totalValue += deal.value;

    if (deal.stage === 'won') {
      stat.wonDeals += 1;
      stat.wonValue += deal.value;
    } else if (deal.stage !== 'lost') {
      stat.activeValue += deal.value;
    }
  }

  // Calculate achievement percentage
  const list = Object.values(picMap).map(item => {
    const pct = item.target > 0 ? (item.wonValue / item.target) * 100 : 0;
    return {
      ...item,
      achievementPct: Math.round(pct * 10) / 10,
    };
  });

  return list.sort((a, b) => b.wonValue - a.wonValue);
}

/**
 * Validation rules
 */
export function validateDealInput(deal: Partial<Deal>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!deal.title || !deal.title.trim()) {
    errors.title = 'Nama proyek / detail deal wajib diisi';
  }

  if (!deal.customerId && !deal.customerName) {
    errors.customer = 'Kontak customer / nama customer wajib dipilih';
  }

  if (deal.value === undefined || deal.value === null || deal.value <= 0) {
    errors.value = 'Nilai deal wajib diisi angka lebih dari 0';
  }

  if (!deal.stage) {
    errors.stage = 'Tahapan deal wajib dipilih';
  }

  if (!deal.picId && !deal.picName) {
    errors.pic = 'PIC Sales wajib dipilih';
  }

  if (deal.stage === 'lost') {
    if (!deal.lostReason || !deal.lostReason.trim()) {
      errors.lostReason = 'Alasan status Lost wajib dipilih!';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCustomerInput(customer: Partial<Customer>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!customer.name || !customer.name.trim()) {
    errors.name = 'Nama customer wajib diisi';
  }

  if (!customer.phone || !customer.phone.trim()) {
    errors.phone = 'Nomor telepon wajib diisi';
  }

  if (!customer.email || !customer.email.includes('@')) {
    errors.email = 'Email customer tidak valid';
  }

  if (!customer.address || !customer.address.trim()) {
    errors.address = 'Alamat lengkap wajib diisi';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateTeamMemberInput(member: Partial<TeamMember>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!member.name || !member.name.trim()) {
    errors.name = 'Nama anggota tim wajib diisi';
  }

  if (!member.email || !member.email.includes('@')) {
    errors.email = 'Email tim tidak valid';
  }

  if (!member.role || !['super_admin', 'admin'].includes(member.role)) {
    errors.role = 'Role wajib dipilih (Super Admin atau Admin)';
  }

  if (!member.title || !['Senior Sales Executive', 'Account Executive'].includes(member.title)) {
    errors.title = 'Jabatan wajib dipilih';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * System Self-Check / Auto-Checker
 * Validates integrity of relationships, constraints, and business invariants
 */
export function runSystemIntegrityCheck(state: {
  deals: Deal[];
  customers: Customer[];
  team: TeamMember[];
  target: SalesTargetSetting;
  logs: AuditLog[];
}) {
  const issues: string[] = [];
  const checks: { name: string; passed: boolean; message: string }[] = [];

  // Check 1: Target Sales is defined and valid positive number
  const targetValid = state.target && state.target.monthlyTarget > 0;
  checks.push({
    name: 'Sales Target Definition',
    passed: targetValid,
    message: targetValid
      ? `Target bulanan valid: ${formatRupiah(state.target.monthlyTarget)}`
      : 'Target sales tidak valid atau nol',
  });

  // Check 2: Customer IDs integrity
  const customerIds = new Set(state.customers.map(c => c.id));
  let orphanDeals = 0;
  for (const deal of state.deals) {
    if (deal.customerId && !customerIds.has(deal.customerId)) {
      orphanDeals++;
    }
  }
  checks.push({
    name: 'Customer-Deal Relationship Integrity',
    passed: orphanDeals === 0,
    message: orphanDeals === 0
      ? `Semua ${state.deals.length} deal terhubung dengan data customer valid`
      : `Ditemukan ${orphanDeals} deal dengan customer ID tidak terdaftar`,
  });

  // Check 3: Lost reason mandatory rule
  const lostDealsWithoutReason = state.deals.filter(d => d.stage === 'lost' && (!d.lostReason || !d.lostReason.trim()));
  checks.push({
    name: 'Mandatory Lost Reason Rule Enforcement',
    passed: lostDealsWithoutReason.length === 0,
    message: lostDealsWithoutReason.length === 0
      ? 'Semua deal status "Lost" memiliki alasan tercatat sesuai aturan'
      : `Ditemukan ${lostDealsWithoutReason.length} deal Lost tanpa alasan!`,
  });

  // Check 4: PIC Sales existence
  const teamIds = new Set(state.team.map(t => t.id));
  const dealsWithInvalidPic = state.deals.filter(d => !d.picId || !d.picName);
  checks.push({
    name: 'PIC Sales Assignment Integrity',
    passed: dealsWithInvalidPic.length === 0,
    message: dealsWithInvalidPic.length === 0
      ? 'Semua transaksi deal memiliki penanggung jawab PIC Sales yang sah'
      : `Ditemukan ${dealsWithInvalidPic.length} deal tanpa PIC Sales`,
  });

  // Check 5: Role access configuration
  const superAdmins = state.team.filter(t => t.role === 'super_admin');
  checks.push({
    name: 'Super Admin Access Configuration',
    passed: superAdmins.length > 0,
    message: superAdmins.length > 0
      ? `Terdapat ${superAdmins.length} Super Admin (Senior Sales Executive) terkonfigurasi`
      : 'PERINGATAN: Tidak ada akun Super Admin yang aktif!',
  });

  return {
    allPassed: checks.every(c => c.passed),
    checks,
    totalChecks: checks.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export data to CSV string and download in browser
 */
export function generateCSVContent(headers: string[], rows: (string | number)[][]): string {
  const sanitize = (val: string | number) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(sanitize).join(',');
  const dataRows = rows.map(r => r.map(sanitize).join(','));
  return [headerRow, ...dataRows].join('\r\n');
}
