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
