import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiah,
  formatCompactRupiah,
  calculatePipelineSummary,
  calculateTargetPerformance,
  validateDealInput,
  validateCustomerInput,
  validateTeamMemberInput,
  calculateLostReasonsBreakdown,
  calculateSalesPerformance,
  runSystemIntegrityCheck,
  generateCSVContent,
  filterDealsByPeriod,
} from './salesLogic.ts';
import type { Deal, Customer, TeamMember, SalesTargetSetting, AuditLog } from '../types/index.ts';

const dummyCustomers: Customer[] = [
  {
    id: 'c1',
    code: 'CUST-001',
    name: 'PT Graha Mahardika',
    email: 'info@grahamahardika.com',
    phone: '081298765432',
    address: 'Jl. Sudirman No. 45, Jakarta Selatan',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'c2',
    code: 'CUST-002',
    name: 'Bapak Hendra Wijaya',
    email: 'hendra.w@gmail.com',
    phone: '081122334455',
    address: 'Pondok Indah Bukit Hijau No. 12',
    createdAt: '2026-02-15T09:30:00Z',
  },
];

const dummyTeam: TeamMember[] = [
  {
    id: 't1',
    name: 'Fitroh Adhiansyah',
    email: 'fitro@biotasmarthome.com',
    role: 'super_admin',
    title: 'Senior Sales Executive',
    phone: '08120000001',
    status: 'active',
    individualTarget: 1_000_000_000,
    joinedDate: '2025-01-01',
  },
  {
    id: 't2',
    name: 'Rian Pratama',
    email: 'rian@biotasmarthome.com',
    role: 'admin',
    title: 'Account Executive',
    phone: '08120000002',
    status: 'active',
    individualTarget: 500_000_000,
    joinedDate: '2025-06-01',
  },
];

const dummyDeals: Deal[] = [
  {
    id: 'd1',
    code: 'D-101',
    title: 'Smart Penthouse Pakubuwono - Luxury Suite',
    customerId: 'c1',
    customerName: 'PT Graha Mahardika',
    value: 250_000_000,
    stage: 'won',
    picId: 't1',
    picName: 'Fitroh Adhiansyah',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  },
  {
    id: 'd2',
    code: 'D-102',
    title: 'Pondok Indah Smart Residence Full IoT',
    customerId: 'c2',
    customerName: 'Bapak Hendra Wijaya',
    value: 150_000_000,
    stage: 'proposal',
    picId: 't2',
    picName: 'Rian Pratama',
    createdAt: '2026-10-05T10:00:00Z',
    updatedAt: '2026-10-06T10:00:00Z',
  },
  {
    id: 'd3',
    code: 'D-103',
    title: 'Apartemen Aeropolis Smart Lighting 20 Unit',
    customerId: 'c1',
    customerName: 'PT Graha Mahardika',
    value: 100_000_000,
    stage: 'lost',
    picId: 't2',
    picName: 'Rian Pratama',
    lostReason: 'Budget tidak sesuai',
    lostNotes: 'Klien memotong anggaran interior sebesar 40%',
    createdAt: '2026-10-08T10:00:00Z',
    updatedAt: '2026-10-12T10:00:00Z',
  },
];

const dummyTarget: SalesTargetSetting = {
  monthlyTarget: 1_000_000_000,
  quarterlyTarget: 3_000_000_000,
  yearlyTarget: 12_000_000_000,
  periodName: 'Oktober 2026',
  lastUpdatedBy: 'Fitroh Adhiansyah',
  lastUpdatedAt: '2026-10-01T08:00:00Z',
};

test('formatRupiah formats standard and zero numbers correctly', () => {
  assert.equal(formatRupiah(250000000), 'Rp 250.000.000');
  assert.equal(formatRupiah(0), 'Rp 0');
  assert.equal(formatCompactRupiah(2500000000), 'Rp 2.5 M');
  assert.equal(formatCompactRupiah(150000000), 'Rp 150 Jt');
});

test('calculatePipelineSummary calculates total, won, active, and win rate', () => {
  const summary = calculatePipelineSummary(dummyDeals);
  assert.equal(summary.totalDealsCount, 3);
  assert.equal(summary.allDealsValue, 500_000_000);
  assert.equal(summary.wonTotal, 250_000_000);
  assert.equal(summary.wonCount, 1);
  assert.equal(summary.totalActiveValue, 150_000_000); // only proposal is active
  assert.equal(summary.summary.won.count, 1);
  assert.equal(summary.summary.proposal.count, 1);
  assert.equal(summary.summary.lost.count, 1);
  assert.equal(summary.winRate, 33.3);
});

test('calculateTargetPerformance computes achievement percentage and remaining', () => {
  const perf = calculateTargetPerformance(250_000_000, 1_000_000_000);
  assert.equal(perf.percentage, 25);
  assert.equal(perf.remaining, 750_000_000);
  assert.equal(perf.isTargetAchieved, false);

  const achieved = calculateTargetPerformance(1_200_000_000, 1_000_000_000);
  assert.equal(achieved.isTargetAchieved, true);
  assert.equal(achieved.remaining, 0);
});

test('validateDealInput enforces mandatory fields and mandatory Lost Reason', () => {
  // Missing title & customer
  const invalid1 = validateDealInput({ value: 10000000 });
  assert.equal(invalid1.isValid, false);
  assert.ok(invalid1.errors.title);
  assert.ok(invalid1.errors.customer);

  // Status is 'lost' but no lostReason provided -> MUST FAIL!
  const invalidLost = validateDealInput({
    title: 'Cluster Smart Villa',
    customerId: 'c1',
    customerName: 'PT Graha',
    value: 50000000,
    stage: 'lost',
    picId: 't1',
  });
  assert.equal(invalidLost.isValid, false);
  assert.ok(invalidLost.errors.lostReason, 'Must enforce lost reason when stage is lost');

  // Valid lost deal with reason
  const validLost = validateDealInput({
    title: 'Cluster Smart Villa',
    customerId: 'c1',
    customerName: 'PT Graha',
    value: 50000000,
    stage: 'lost',
    picId: 't1',
    lostReason: 'Budget tidak sesuai',
  });
  assert.equal(validLost.isValid, true);
});

test('validateCustomerInput checks required customer data', () => {
  const invalid = validateCustomerInput({ name: '' });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.name);

  const valid = validateCustomerInput({
    name: 'PT Cahaya Abadi',
    phone: '08123456789',
    email: 'cahaya@abadi.com',
    address: 'Jl. Melati 10',
  });
  assert.equal(valid.isValid, true);
});

test('validateTeamMemberInput validates roles and titles', () => {
  const invalid = validateTeamMemberInput({ name: 'Budi' });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.role);

  const valid = validateTeamMemberInput({
    name: 'Budi Santoso',
    email: 'budi@biotasmarthome.com',
    role: 'super_admin',
    title: 'Senior Sales Executive',
  });
  assert.equal(valid.isValid, true);
});

test('calculateLostReasonsBreakdown groups reasons with values', () => {
  const breakdown = calculateLostReasonsBreakdown(dummyDeals);
  assert.equal(breakdown.length, 1);
  assert.equal(breakdown[0].reason, 'Budget tidak sesuai');
  assert.equal(breakdown[0].count, 1);
  assert.equal(breakdown[0].totalValue, 100_000_000);
});

test('calculateSalesPerformance calculates per-PIC stats', () => {
  const perf = calculateSalesPerformance(dummyDeals, dummyTeam);
  assert.equal(perf.length, 2);
  const fitro = perf.find(p => p.member.id === 't1');
  assert.ok(fitro);
  assert.equal(fitro.wonValue, 250_000_000);
  assert.equal(fitro.achievementPct, 25);
});

test('runSystemIntegrityCheck runs comprehensive auto-checker', () => {
  const checkResult = runSystemIntegrityCheck({
    deals: dummyDeals,
    customers: dummyCustomers,
    team: dummyTeam,
    target: dummyTarget,
    logs: [],
  });

  assert.equal(checkResult.allPassed, true);
  assert.equal(checkResult.totalChecks, 5);
});

test('generateCSVContent formats valid CSV string', () => {
  const headers = ['Kode', 'Proyek', 'Nilai'];
  const rows = [['D-101', 'Smart Home Penthouse', 250000000]];
  const csv = generateCSVContent(headers, rows);
  assert.ok(csv.includes('"Kode","Proyek","Nilai"'));
  assert.ok(csv.includes('"D-101","Smart Home Penthouse","250000000"'));
});

// =========================================================================
// FORWARD AND REVERSE LOGIC UNIT TESTS (DEAL LIFECYCLE & SYNC INTEGRITY)
// =========================================================================

test('filterDealsByPeriod handles current and active deals correctly across periods', () => {
  const now = new Date('2026-10-17T17:00:00.000Z');
  
  const testDeals: Deal[] = [
    {
      id: 'd_active_today',
      code: 'D-201',
      title: 'Smart Villa Bali',
      customerId: 'c1',
      customerName: 'PT Graha',
      value: 1_500_000,
      stage: 'proposal',
      picId: 't1',
      picName: 'Fitroh Adhiansyah',
      createdAt: '2026-10-17T10:00:00.000Z',
    },
    {
      id: 'd_old_active',
      code: 'D-202',
      title: 'Apartemen Bandung IoT',
      customerId: 'c2',
      customerName: 'Hendra',
      value: 3_000_000,
      stage: 'follow_up',
      picId: 't2',
      picName: 'Rian Pratama',
      createdAt: '2026-08-01T10:00:00.000Z', // 2 months ago, but still active!
    },
    {
      id: 'd_old_won',
      code: 'D-203',
      title: 'Closed Deal in August',
      customerId: 'c1',
      customerName: 'PT Graha',
      value: 5_000_000,
      stage: 'won',
      picId: 't1',
      picName: 'Fitroh Adhiansyah',
      createdAt: '2026-08-15T10:00:00.000Z',
    },
  ];

  // 'all' returns all 3 deals
  const allResult = filterDealsByPeriod(testDeals, 'all', now);
  assert.equal(allResult.length, 3);

  // 'month' returns today's proposal AND old active follow_up, but NOT old August won deal
  const monthResult = filterDealsByPeriod(testDeals, 'month', now);
  assert.equal(monthResult.length, 2);
  assert.ok(monthResult.some(d => d.id === 'd_active_today'));
  assert.ok(monthResult.some(d => d.id === 'd_old_active'));
  assert.ok(!monthResult.some(d => d.id === 'd_old_won'));

  // 'today' returns today's deal
  const todayResult = filterDealsByPeriod(testDeals, 'today', now);
  assert.equal(todayResult.length, 1);
  assert.equal(todayResult[0].id, 'd_active_today');
});

test('Deal State Transitions: Forward and REVERSE logic verification', () => {
  // Step 0: Starting with empty state
  let currentDeals: Deal[] = [];
  let s0 = calculatePipelineSummary(currentDeals);
  assert.equal(s0.totalDealsCount, 0);
  assert.equal(s0.allDealsValue, 0);
  assert.equal(s0.totalActiveValue, 0);
  assert.equal(s0.wonTotal, 0);

  // Step 1 [FORWARD]: Add Deal in Proposal stage (Rp 1.500.000)
  const deal1: Deal = {
    id: 'd_test_1',
    code: 'D-501',
    title: 'Smart Office Sudirman',
    customerId: 'c1',
    customerName: 'PT Graha Mahardika',
    value: 1_500_000,
    stage: 'proposal',
    picId: 't1',
    picName: 'Fitroh Adhiansyah',
    createdAt: '2026-10-17T12:00:00Z',
  };
  currentDeals = [deal1];

  let s1 = calculatePipelineSummary(currentDeals);
  assert.equal(s1.totalDealsCount, 1);
  assert.equal(s1.allDealsValue, 1_500_000);
  assert.equal(s1.summary.proposal.count, 1);
  assert.equal(s1.summary.proposal.totalValue, 1_500_000);
  assert.equal(s1.totalActiveValue, 1_500_000); // Proposal is active pipeline
  assert.equal(s1.wonTotal, 0);
  assert.equal(s1.wonCount, 0);

  let targetPerf1 = calculateTargetPerformance(s1.wonTotal, 10_000_000); // Target Rp 10 Jt
  assert.equal(targetPerf1.percentage, 0);
  assert.equal(targetPerf1.remaining, 10_000_000);
  assert.equal(targetPerf1.isTargetAchieved, false);

  // Step 2 [FORWARD]: Move deal from Proposal -> Won (Closing)
  currentDeals = currentDeals.map(d => (d.id === deal1.id ? { ...d, stage: 'won' as const } : d));
  let s2 = calculatePipelineSummary(currentDeals);
  assert.equal(s2.summary.proposal.count, 0, 'Proposal count must reverse to 0');
  assert.equal(s2.summary.proposal.totalValue, 0, 'Proposal value must reverse to 0');
  assert.equal(s2.totalActiveValue, 0, 'Active pipeline value must reverse to 0 when won');
  assert.equal(s2.wonCount, 1, 'Won count increases to 1');
  assert.equal(s2.wonTotal, 1_500_000, 'Won total is Rp 1.5 Jt');

  let targetPerf2 = calculateTargetPerformance(s2.wonTotal, 10_000_000);
  assert.equal(targetPerf2.percentage, 15, 'Target achievement is 15%');
  assert.equal(targetPerf2.remaining, 8_500_000, 'Remaining target is 8.5 Jt');

  // Step 3 [REVERSE]: Move deal BACK from Won -> Proposal (Undo Closing)
  currentDeals = currentDeals.map(d => (d.id === deal1.id ? { ...d, stage: 'proposal' as const } : d));
  let s3 = calculatePipelineSummary(currentDeals);
  assert.equal(s3.wonCount, 0, 'Won count must reverse back to 0');
  assert.equal(s3.wonTotal, 0, 'Won total must reverse back to 0');
  assert.equal(s3.summary.proposal.count, 1, 'Proposal count restored to 1');
  assert.equal(s3.summary.proposal.totalValue, 1_500_000, 'Proposal value restored to Rp 1.5 Jt');
  assert.equal(s3.totalActiveValue, 1_500_000, 'Active pipeline restored to Rp 1.5 Jt');

  let targetPerf3 = calculateTargetPerformance(s3.wonTotal, 10_000_000);
  assert.equal(targetPerf3.percentage, 0, 'Target percentage restored back to 0%');
  assert.equal(targetPerf3.remaining, 10_000_000, 'Remaining target restored back to 10 Jt');

  // Step 4 [FORWARD]: Move deal to Lost (with reason)
  currentDeals = currentDeals.map(d =>
    d.id === deal1.id
      ? { ...d, stage: 'lost' as const, lostReason: 'Kompetitor harga lebih murah' }
      : d
  );
  let s4 = calculatePipelineSummary(currentDeals);
  assert.equal(s4.summary.proposal.count, 0);
  assert.equal(s4.totalActiveValue, 0);
  assert.equal(s4.summary.lost.count, 1);
  assert.equal(s4.summary.lost.totalValue, 1_500_000);
  let lostBreakdown4 = calculateLostReasonsBreakdown(currentDeals);
  assert.equal(lostBreakdown4.length, 1);
  assert.equal(lostBreakdown4[0].reason, 'Kompetitor harga lebih murah');

  // Step 5 [REVERSE]: Move deal BACK from Lost -> Follow Up (Revive Deal)
  currentDeals = currentDeals.map(d => {
    if (d.id !== deal1.id) return d;
    const rev = { ...d, stage: 'follow_up' as const };
    delete rev.lostReason;
    return rev;
  });
  let s5 = calculatePipelineSummary(currentDeals);
  assert.equal(s5.summary.lost.count, 0, 'Lost count reverses to 0');
  assert.equal(s5.summary.lost.totalValue, 0, 'Lost value reverses to 0');
  assert.equal(s5.summary.follow_up.count, 1, 'Follow Up count is 1');
  assert.equal(s5.summary.follow_up.totalValue, 1_500_000, 'Follow Up value is 1.5 Jt');
  assert.equal(s5.totalActiveValue, 1_500_000, 'Active pipeline restored to 1.5 Jt');
  let lostBreakdown5 = calculateLostReasonsBreakdown(currentDeals);
  assert.equal(lostBreakdown5.length, 0, 'Lost breakdown must be clean empty');

  // Step 6 [FORWARD & REVERSE]: Update Deal Value from 1.5 Jt to 5 Jt, then reverse back
  // Value update forward
  currentDeals = currentDeals.map(d => (d.id === deal1.id ? { ...d, value: 5_000_000 } : d));
  let s6 = calculatePipelineSummary(currentDeals);
  assert.equal(s6.summary.follow_up.totalValue, 5_000_000);
  assert.equal(s6.totalActiveValue, 5_000_000);
  assert.equal(s6.allDealsValue, 5_000_000);

  // Value update reverse
  currentDeals = currentDeals.map(d => (d.id === deal1.id ? { ...d, value: 1_500_000 } : d));
  let s6Rev = calculatePipelineSummary(currentDeals);
  assert.equal(s6Rev.summary.follow_up.totalValue, 1_500_000);
  assert.equal(s6Rev.totalActiveValue, 1_500_000);
  assert.equal(s6Rev.allDealsValue, 1_500_000);

  // Step 7 [FULL REVERSE]: Delete Deal
  currentDeals = currentDeals.filter(d => d.id !== deal1.id);
  let s7 = calculatePipelineSummary(currentDeals);
  assert.equal(s7.totalDealsCount, 0, 'Total deals count returns to 0');
  assert.equal(s7.allDealsValue, 0, 'All deals value returns to 0');
  assert.equal(s7.totalActiveValue, 0, 'Active pipeline value returns to 0');
  assert.equal(s7.summary.lead_in.count, 0);
  assert.equal(s7.summary.follow_up.count, 0);
  assert.equal(s7.summary.proposal.count, 0);
  assert.equal(s7.summary.won.count, 0);
  assert.equal(s7.summary.lost.count, 0);
});

