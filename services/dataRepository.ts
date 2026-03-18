
import { BillData, User, TopUpRecord, FacilityUsageRecord, PackageRecord, AuditLog, TabSettings, AppTab } from '../types';
import { 
  INITIAL_BILLS, 
  INITIAL_USERS, 
  INITIAL_TOPUP_RECORDS, 
  INITIAL_FACILITY_USAGE, 
  INITIAL_PACKAGE_RECORDS 
} from '../constants';

// LocalStorage Keys
const KEYS = {
  BILLS: 'APP_BILLS',
  USERS: 'APP_USERS',
  TOPUPS: 'APP_TOPUPS',
  FACILITY_USAGE: 'APP_FACILITY_USAGE',
  PACKAGES: 'APP_PACKAGES',
  LOGS: 'APP_LOGS',
  TAB_SETTINGS: 'APP_TAB_SETTINGS'
};

const DEFAULT_TAB_SETTINGS: TabSettings = {
  [AppTab.ELECTRICITY]: true,
  [AppTab.WATER]: true,
  [AppTab.PACKAGES]: true,
  [AppTab.FACILITIES]: true
};

// Helper to get data with fallback
const getLocalData = <T>(key: string, fallback: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      // Initialize with fallback if not present
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.warn(`Failed to parse local storage for ${key}, resetting to default.`);
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
};

const setLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    return getLocalData(KEYS.USERS, INITIAL_USERS);
  },
  
  saveUser: async (user: User, isNew: boolean) => {
    const users = getLocalData<User>(KEYS.USERS, INITIAL_USERS);
    if (isNew) {
      users.push(user);
    } else {
      const idx = users.findIndex(u => u.username === user.username);
      if (idx !== -1) users[idx] = user;
    }
    setLocalData(KEYS.USERS, users);
  },

  deleteUser: async (username: string) => {
    let users = getLocalData<User>(KEYS.USERS, INITIAL_USERS);
    users = users.filter(u => u.username !== username);
    setLocalData(KEYS.USERS, users);
  },

  // --- BILLS ---
  getBills: async (): Promise<BillData[]> => {
    return getLocalData(KEYS.BILLS, INITIAL_BILLS);
  },

  saveBill: async (bill: BillData) => {
    const bills = getLocalData<BillData>(KEYS.BILLS, INITIAL_BILLS);
    const idx = bills.findIndex(b => b.id === bill.id);
    if (idx !== -1) {
      bills[idx] = bill;
    } else {
      bills.push(bill);
    }
    setLocalData(KEYS.BILLS, bills);
  },

  deleteBill: async (id: string) => {
    let bills = getLocalData<BillData>(KEYS.BILLS, INITIAL_BILLS);
    bills = bills.filter(b => b.id !== id);
    setLocalData(KEYS.BILLS, bills);
  },

  // --- TOP UPS ---
  getTopUps: async (): Promise<TopUpRecord[]> => {
    return getLocalData(KEYS.TOPUPS, INITIAL_TOPUP_RECORDS);
  },

  saveTopUp: async (record: TopUpRecord) => {
    const records = getLocalData<TopUpRecord>(KEYS.TOPUPS, INITIAL_TOPUP_RECORDS);
    const idx = records.findIndex(r => r.id === record.id);
    if (idx !== -1) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    setLocalData(KEYS.TOPUPS, records);
  },

  deleteTopUp: async (id: string) => {
    let records = getLocalData<TopUpRecord>(KEYS.TOPUPS, INITIAL_TOPUP_RECORDS);
    records = records.filter(r => r.id !== id);
    setLocalData(KEYS.TOPUPS, records);
  },

  // --- FACILITY USAGE ---
  getFacilityUsages: async (): Promise<FacilityUsageRecord[]> => {
    return getLocalData(KEYS.FACILITY_USAGE, INITIAL_FACILITY_USAGE);
  },

  saveFacilityUsage: async (record: FacilityUsageRecord) => {
    const records = getLocalData<FacilityUsageRecord>(KEYS.FACILITY_USAGE, INITIAL_FACILITY_USAGE);
    const idx = records.findIndex(r => r.id === record.id);
    if (idx !== -1) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    setLocalData(KEYS.FACILITY_USAGE, records);
  },

  // --- PACKAGES ---
  getPackages: async (): Promise<PackageRecord[]> => {
    return getLocalData(KEYS.PACKAGES, INITIAL_PACKAGE_RECORDS);
  },

  savePackage: async (record: PackageRecord) => {
    const records = getLocalData<PackageRecord>(KEYS.PACKAGES, INITIAL_PACKAGE_RECORDS);
    const idx = records.findIndex(r => r.id === record.id);
    if (idx !== -1) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    setLocalData(KEYS.PACKAGES, records);
  },

  deletePackage: async (id: string) => {
    let records = getLocalData<PackageRecord>(KEYS.PACKAGES, INITIAL_PACKAGE_RECORDS);
    records = records.filter(r => r.id !== id);
    setLocalData(KEYS.PACKAGES, records);
  },

  // --- AUDIT LOGS ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    return getLocalData(KEYS.LOGS, []);
  },

  addAuditLog: async (log: Omit<AuditLog, 'id'>) => {
    const logs = getLocalData<AuditLog>(KEYS.LOGS, []);
    const newLog: AuditLog = { ...log, id: crypto.randomUUID() };
    logs.push(newLog);
    // Keep only last 500 logs to prevent storage overflow
    if (logs.length > 500) logs.shift();
    setLocalData(KEYS.LOGS, logs);
  },

  // --- TAB SETTINGS ---
  getTabSettings: async (): Promise<TabSettings> => {
    try {
      const stored = localStorage.getItem(KEYS.TAB_SETTINGS);
      if (!stored) return DEFAULT_TAB_SETTINGS;
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_TAB_SETTINGS;
    }
  },

  saveTabSettings: async (settings: TabSettings) => {
    localStorage.setItem(KEYS.TAB_SETTINGS, JSON.stringify(settings));
  }
};