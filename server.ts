import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_TEAM,
  INITIAL_DEALS,
  INITIAL_TARGET,
  INITIAL_AUDIT_LOGS,
} from './src/data/mockData.ts';
import {
  validateDealInput,
  validateCustomerInput,
  validateTeamMemberInput,
  runSystemIntegrityCheck,
} from './src/utils/salesLogic.ts';
import type { Deal, Customer, TeamMember, SalesTargetSetting, AuditLog } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local JSON Database persistence
const DB_FILE = path.resolve(__dirname, 'storage', 'db.json');

function ensureStorageDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadDatabase() {
  try {
    ensureStorageDir();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      console.log('✅ Local persistent database loaded from storage/db.json');
      return {
        deals: Array.isArray(parsed.deals) ? parsed.deals : [...INITIAL_DEALS],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [...INITIAL_CUSTOMERS],
        team: Array.isArray(parsed.team) ? parsed.team : [...INITIAL_TEAM],
        target: parsed.target ? parsed.target : { ...INITIAL_TARGET },
        logs: Array.isArray(parsed.logs) ? parsed.logs : [...INITIAL_AUDIT_LOGS],
      };
    }
  } catch (err) {
    console.warn('⚠️ Could not load storage/db.json, initializing from defaults:', err);
  }

  const initial = {
    deals: [...INITIAL_DEALS],
    customers: [...INITIAL_CUSTOMERS],
    team: [...INITIAL_TEAM],
    target: { ...INITIAL_TARGET },
    logs: [...INITIAL_AUDIT_LOGS],
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(overrideState?: any) {
  try {
    ensureStorageDir();
    const state = overrideState || {
      deals: dealsStore,
      customers: customersStore,
      team: teamStore,
      target: targetStore,
      logs: logsStore,
      lastSaved: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Failed to persist to storage/db.json:', err);
  }
}

const initialDb = loadDatabase();
let dealsStore: Deal[] = initialDb.deals;
let customersStore: Customer[] = initialDb.customers;
let teamStore: TeamMember[] = initialDb.team;
let targetStore: SalesTargetSetting = initialDb.target;
let logsStore: AuditLog[] = initialDb.logs;

function addAuditLog(
  userId: string,
  userName: string,
  userRole: 'super_admin' | 'admin',
  actionCategory: AuditLog['actionCategory'],
  actionType: string,
  description: string,
  details?: Record<string, any>
) {
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole,
    actionCategory,
    actionType,
    description,
    details,
  };
  logsStore.unshift(newLog);
  // Keep last 200 logs
  if (logsStore.length > 200) {
    logsStore = logsStore.slice(0, 200);
  }
  saveDatabase();
  return newLog;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ---------------- API ENDPOINTS ----------------

  // Health and System Status Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      counts: {
        deals: dealsStore.length,
        customers: customersStore.length,
        team: teamStore.length,
        logs: logsStore.length,
      },
      target: targetStore.monthlyTarget,
    });
  });

  // Automated System Integrity & Endpoint Checker
  app.get('/api/autocheck', (req, res) => {
    const report = runSystemIntegrityCheck({
      deals: dealsStore,
      customers: customersStore,
      team: teamStore,
      target: targetStore,
      logs: logsStore,
    });
    res.json({
      success: true,
      report,
    });
  });

  // Auth: Mock login / verify
  app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    const user = INITIAL_USERS.find(u => u.email.toLowerCase() === (email || '').toLowerCase()) || INITIAL_USERS[0];
    
    addAuditLog(
      user.id,
      user.name,
      user.role,
      'AUTH',
      'LOGIN',
      `${user.title} ${user.name} berhasil login ke dashboard.`
    );

    res.json({ success: true, user });
  });

  // DEALS Endpoints
  app.get('/api/deals', (req, res) => {
    res.json({ success: true, data: dealsStore });
  });

  app.post('/api/deals', (req, res) => {
    const { deal, actor } = req.body;
    const validation = validateDealInput(deal);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const nextNumber = dealsStore.length + 101;
    const newDeal: Deal = {
      id: `deal_${Date.now()}`,
      code: `D-${nextNumber}`,
      title: deal.title,
      customerId: deal.customerId,
      customerName: deal.customerName,
      customerPhone: deal.customerPhone,
      customerEmail: deal.customerEmail,
      value: Number(deal.value),
      stage: deal.stage || 'lead_in',
      picId: deal.picId,
      picName: deal.picName,
      notes: deal.notes || '',
      lostReason: deal.lostReason,
      lostNotes: deal.lostNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expectedCloseDate: deal.expectedCloseDate,
    };

    dealsStore.unshift(newDeal);

    if (actor) {
      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'DEAL',
        'CREATE_DEAL',
        `${actor.name} menambahkan deal baru: ${newDeal.code} - ${newDeal.title}`,
        { dealId: newDeal.id, value: newDeal.value }
      );
    }

    res.status(201).json({ success: true, data: newDeal });
  });

  app.put('/api/deals/:id', (req, res) => {
    const { id } = req.params;
    const { dealUpdates, actor } = req.body;
    const index = dealsStore.findIndex(d => d.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Deal tidak ditemukan' });
    }

    const prevDeal = dealsStore[index];
    const updatedDeal: Deal = {
      ...prevDeal,
      ...dealUpdates,
      updatedAt: new Date().toISOString(),
    };

    // If changing to lost, enforce lost reason
    if (updatedDeal.stage === 'lost' && !updatedDeal.lostReason) {
      return res.status(400).json({
        success: false,
        errors: { lostReason: 'Alasan status Lost wajib disertakan!' },
      });
    }

    dealsStore[index] = updatedDeal;

    if (actor) {
      const isStageChange = prevDeal.stage !== updatedDeal.stage;
      const desc = isStageChange
        ? updatedDeal.stage === 'lost'
          ? `${actor.name} memindahkan deal ${updatedDeal.code} ke LOST dengan alasan: "${updatedDeal.lostReason}"`
          : `${actor.name} memindahkan deal ${updatedDeal.code} ke tahapan ${updatedDeal.stage.toUpperCase()}`
        : `${actor.name} memperbarui data deal ${updatedDeal.code} - ${updatedDeal.title}`;

      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'DEAL',
        isStageChange ? 'UPDATE_STAGE' : 'UPDATE_DEAL',
        desc,
        { prevStage: prevDeal.stage, newStage: updatedDeal.stage }
      );
    }

    res.json({ success: true, data: updatedDeal });
  });

  app.delete('/api/deals/:id', (req, res) => {
    const { id } = req.params;
    const { actor } = req.body || {};
    const deal = dealsStore.find(d => d.id === id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal tidak ditemukan' });
    }

    dealsStore = dealsStore.filter(d => d.id !== id);

    if (actor) {
      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'DEAL',
        'DELETE_DEAL',
        `${actor.name} menghapus deal: ${deal.code} - ${deal.title}`
      );
    }

    res.json({ success: true, message: 'Deal berhasil dihapus' });
  });

  // CUSTOMERS Endpoints
  app.get('/api/customers', (req, res) => {
    res.json({ success: true, data: customersStore });
  });

  app.post('/api/customers', (req, res) => {
    const { customer, actor } = req.body;
    const validation = validateCustomerInput(customer);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const nextId = customersStore.length + 1;
    const code = customer.code?.trim() || `CUST-00${nextId}`;

    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      code,
      name: customer.name.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim(),
      address: customer.address.trim(),
      notes: customer.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    customersStore.unshift(newCustomer);

    if (actor) {
      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'CUSTOMER',
        'CREATE_CUSTOMER',
        `${actor.name} menambahkan customer baru: ${newCustomer.name} (${newCustomer.code})`
      );
    }

    res.status(201).json({ success: true, data: newCustomer });
  });

  app.put('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const { customerUpdates, actor } = req.body;
    const index = customersStore.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
    }

    const updated = { ...customersStore[index], ...customerUpdates };
    customersStore[index] = updated;

    if (actor) {
      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'CUSTOMER',
        'UPDATE_CUSTOMER',
        `${actor.name} memperbarui data customer ${updated.name}`
      );
    }

    res.json({ success: true, data: updated });
  });

  // Role Gate: HAPUS CUSTOMER HANYA BISA SUPER ADMIN
  app.delete('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const actorRole = req.headers['x-user-role'] as string || req.body?.actor?.role;
    const actorName = req.headers['x-user-name'] as string || req.body?.actor?.name || 'User';

    if (actorRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Hanya Super Admin (Senior Sales Executive) yang berhak menghapus data customer!',
      });
    }

    const targetCustomer = customersStore.find(c => c.id === id);
    if (!targetCustomer) {
      return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
    }

    customersStore = customersStore.filter(c => c.id !== id);

    addAuditLog(
      'super_admin',
      actorName,
      'super_admin',
      'CUSTOMER',
      'DELETE_CUSTOMER',
      `${actorName} (Super Admin) menghapus customer: ${targetCustomer.name} (${targetCustomer.code})`
    );

    res.json({ success: true, message: 'Customer berhasil dihapus' });
  });

  // TEAM Endpoints
  app.get('/api/team', (req, res) => {
    res.json({ success: true, data: teamStore });
  });

  // Super Admin can add team member
  app.post('/api/team', (req, res) => {
    const actorRole = req.headers['x-user-role'] as string || req.body?.actor?.role;
    const { member, actor } = req.body;

    if (actorRole !== 'super_admin' && actor?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Hanya Super Admin yang berhak menambahkan tim baru.',
      });
    }

    const validation = validateTeamMemberInput(member);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const newMember: TeamMember = {
      id: `user_${Date.now()}`,
      name: member.name.trim(),
      email: member.email.trim(),
      role: member.role,
      title: member.title || (member.role === 'super_admin' ? 'Senior Sales Executive' : 'Account Executive'),
      phone: member.phone?.trim() || '-',
      status: member.status || 'active',
      individualTarget: Number(member.individualTarget) || 500_000_000,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    teamStore.push(newMember);
    saveDatabase();

    if (actor) {
      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'TEAM',
        'CREATE_TEAM',
        `${actor.name} menambahkan anggota tim baru: ${newMember.name} (${newMember.title})`
      );
    }

    res.status(201).json({ success: true, data: newMember });
  });

  // Update team member status / target
  app.put('/api/team/:id', (req, res) => {
    const { id } = req.params;
    const actorRole = req.headers['x-user-role'] as string || req.body?.actor?.role;
    const { memberUpdates, actor } = req.body;

    if (actorRole !== 'super_admin' && actor?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Hanya Super Admin yang berhak mengedit data tim.',
      });
    }

    const index = teamStore.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Anggota tim tidak ditemukan' });
    }

    const updated = { ...teamStore[index], ...memberUpdates };
    teamStore[index] = updated;
    saveDatabase();

    if (actor) {
      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'TEAM',
        'UPDATE_TEAM',
        `${actor.name} memperbarui status/jabatan tim: ${updated.name} (${updated.status})`
      );
    }

    res.json({ success: true, data: updated });
  });

  // Super Admin can delete team member
  app.delete('/api/team/:id', (req, res) => {
    const { id } = req.params;
    const actorRole = req.headers['x-user-role'] as string || req.body?.actor?.role;
    const actorName = req.headers['x-user-name'] as string || req.body?.actor?.name || 'Super Admin';

    if (actorRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Hanya Super Admin yang berhak menghapus anggota tim!',
      });
    }

    const member = teamStore.find(t => t.id === id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Anggota tim tidak ditemukan' });
    }

    teamStore = teamStore.filter(t => t.id !== id);
    saveDatabase();

    addAuditLog(
      'super_admin',
      actorName,
      'super_admin',
      'TEAM',
      'DELETE_TEAM',
      `${actorName} menghapus anggota tim: ${member.name} (${member.title})`
    );

    res.json({ success: true, message: 'Anggota tim berhasil dihapus' });
  });

  // SETTINGS: Target Sales (Super Admin Only)
  app.get('/api/settings/target', (req, res) => {
    res.json({ success: true, data: targetStore });
  });

  app.put('/api/settings/target', (req, res) => {
    const actorRole = req.headers['x-user-role'] as string || req.body?.actor?.role;
    const { targetUpdates, actor } = req.body;

    if (actorRole !== 'super_admin' && actor?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Hanya Super Admin (Senior Sales Executive) yang dapat mengubah Target Sales!',
      });
    }

    const newMonthly = Number(targetUpdates.monthlyTarget) || targetStore.monthlyTarget;
    targetStore = {
      ...targetStore,
      ...targetUpdates,
      monthlyTarget: newMonthly,
      quarterlyTarget: newMonthly * 3,
      yearlyTarget: newMonthly * 12,
      lastUpdatedBy: actor?.name || 'Super Admin',
      lastUpdatedAt: new Date().toISOString(),
    };

    if (actor) {
      addAuditLog(
        actor.id,
        actor.name,
        actor.role,
        'SETTING',
        'UPDATE_TARGET',
        `${actor.name} mengubah Target Sales Bulanan menjadi Rp ${newMonthly.toLocaleString('id-ID')}`
      );
    }

    res.json({ success: true, data: targetStore });
  });

  // AUDIT LOGS Endpoints
  app.get('/api/logs', (req, res) => {
    const { category, search } = req.query;
    let list = [...logsStore];

    if (category && category !== 'ALL') {
      list = list.filter(l => l.actionCategory === category);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.description.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: list });
  });

  app.post('/api/logs', (req, res) => {
    const { userId, userName, userRole, actionCategory, actionType, description, details } = req.body;
    const log = addAuditLog(userId, userName, userRole, actionCategory, actionType, description, details);
    res.status(201).json({ success: true, data: log });
  });

  // RESET DATA: Kembalikan ke data awal jika diinginkan
  app.post('/api/reset-data', (req, res) => {
    dealsStore = [...INITIAL_DEALS];
    customersStore = [...INITIAL_CUSTOMERS];
    teamStore = [...INITIAL_TEAM];
    targetStore = { ...INITIAL_TARGET };
    logsStore = [...INITIAL_AUDIT_LOGS];
    saveDatabase();
    res.json({ success: true, message: 'Database berhasil direset ke data bawaan awal' });
  });

  // Vite Integration in Development Mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BIOTA Smarthome Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
