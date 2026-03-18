import { BillData, UserRole, FacilityUsageRecord, TopUpRecord, PackageRecord } from './types';

export const TOTAL_HOUSEHOLDS = 167;

// Updated logic: Month is set to the End Date Month of the billing period
// Example: Period ending 11/26 is labeled as Month 11 (Nov), originally it was Bill Month 12.
export const INITIAL_BILLS: BillData[] = [
  { 
    id: '1', rocYear: 113, month: 7, usage: 11810, amount: 60180,
    billingPeriod: '113年06月28日至113年07月29日', contractCapacity: 50, maxDemand: 49, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 48920, lastReading: 48500, usageCategory: 'C5',
    basicFee: 11810.0, flowFee: 48370.0, paymentAdjustment: 0, others: 0
  },
  { 
    id: '2', rocYear: 113, month: 8, usage: 11040, amount: 49041,
    billingPeriod: '113年07月29日至113年08月29日', contractCapacity: 50, maxDemand: 48, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 49200, lastReading: 48920, usageCategory: 'C5',
    basicFee: 11810.0, flowFee: 37977.6, paymentAdjustment: -746.8, others: 0.2
  },
  { 
    id: '3', rocYear: 113, month: 9, usage: 11040, amount: 49041,
    billingPeriod: '113年08月29日至113年09月26日', contractCapacity: 50, maxDemand: 48, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 49476, lastReading: 49200, usageCategory: 'C5',
    basicFee: 11810.0, flowFee: 37977.6, paymentAdjustment: -746.8, others: 0.2
  },
  { 
    id: '4', rocYear: 113, month: 10, usage: 12600, amount: 52886,
    billingPeriod: '113年09月27日至113年10月29日', contractCapacity: 50, maxDemand: 45, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 49791, lastReading: 49476, usageCategory: 'C5',
    basicFee: 9079.9, flowFee: 44611.6, paymentAdjustment: -805.3, others: -0.2
  },
  { 
    id: '5', rocYear: 113, month: 11, usage: 10120, amount: 47107,
    billingPeriod: '113年10月30日至113年11月27日', contractCapacity: 50, maxDemand: 41, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 50044, lastReading: 49791, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 39164.4, paymentAdjustment: -717.3, others: -0.1
  },
  { 
    id: '6', rocYear: 113, month: 12, usage: 10720, amount: 49394,
    billingPeriod: '113年11月28日至113年12月26日', contractCapacity: 50, maxDemand: 40, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 50312, lastReading: 50044, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 41486.4, paymentAdjustment: -752.1, others: -0.3
  },
  { 
    id: '7', rocYear: 114, month: 1, usage: 9240, amount: 43753,
    billingPeriod: '113年12月27日至114年01月22日', contractCapacity: 50, maxDemand: 40, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 50543, lastReading: 50312, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 35758.8, paymentAdjustment: -666.2, others: 0.4
  },
  { 
    id: '8', rocYear: 114, month: 2, usage: 12080, amount: 54579,
    billingPeriod: '114年01月23日至114年02月24日', contractCapacity: 50, maxDemand: 40, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 50845, lastReading: 50543, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 46749.6, paymentAdjustment: -831.1, others: 0.5
  },
  { 
    id: '9', rocYear: 114, month: 3, usage: 10440, amount: 48327,
    billingPeriod: '114年02月25日至114年03月26日', contractCapacity: 50, maxDemand: 42, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 51106, lastReading: 50845, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 40402.8, paymentAdjustment: -735.9, others: 0.1
  },
  { 
    id: '10', rocYear: 114, month: 4, usage: 12000, amount: 54274,
    billingPeriod: '114年03月27日至114年04月27日', contractCapacity: 50, maxDemand: 41, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 51406, lastReading: 51106, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 46440.0, paymentAdjustment: -826.5, others: 0.5
  },
  { 
    id: '11', rocYear: 114, month: 5, usage: 11880, amount: 53816,
    billingPeriod: '114年04月28日至114年05月26日', contractCapacity: 50, maxDemand: 44, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 51703, lastReading: 51406, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 45975.6, paymentAdjustment: -819.5, others: -0.1
  },
  { 
    id: '12', rocYear: 114, month: 6, usage: 12400, amount: 60521,
    billingPeriod: '114年05月27日至114年06月25日', contractCapacity: 50, maxDemand: 46, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 52013, lastReading: 51703, usageCategory: 'C5',
    basicFee: 11285.0, flowFee: 50158.0, paymentAdjustment: -921.6, others: -0.4
  },
  { 
    id: '13', rocYear: 114, month: 7, usage: 12080, amount: 60180,
    billingPeriod: '114年06月26日至114年07月27日', contractCapacity: 50, maxDemand: 48, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 52315, lastReading: 52013, usageCategory: 'C5',
    basicFee: 11810.0, flowFee: 49286.4, paymentAdjustment: -916.4, others: 0
  },
  { 
    id: '14', rocYear: 114, month: 8, usage: 14040, amount: 68057,
    billingPeriod: '114年07月28日至114年08月26日', contractCapacity: 50, maxDemand: 52, powerFactor: 99,
    meterNumber: '18-33-7005-08-7', currentReading: 52666, lastReading: 52315, usageCategory: 'C5',
    basicFee: 11810.0, flowFee: 57283.2, paymentAdjustment: -1036.3, others: 0.1
  },
  { 
    id: '15', rocYear: 114, month: 9, usage: 12760, amount: 63385,
    billingPeriod: '114年08月27日至114年09月25日', contractCapacity: 50, maxDemand: 50, powerFactor: 99,
    meterNumber: '18-33-7005-08-7', currentReading: 52985, lastReading: 52666, usageCategory: 'C5',
    basicFee: 11810.0, flowFee: 52060.8, paymentAdjustment: -958.0, others: 472.2
  },
  { 
    id: '16', rocYear: 114, month: 10, usage: 14720, amount: 65621,
    billingPeriod: '114年09月26日至114年10月28日', contractCapacity: 50, maxDemand: 49, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 53353, lastReading: 52985, usageCategory: 'C5',
    basicFee: 9185.0, flowFee: 57434.7, paymentAdjustment: -999.2, others: 0.5
  },
  { 
    id: '17', rocYear: 114, month: 11, usage: 10960, amount: 50309,
    billingPeriod: '114年10月29日至114年11月26日', contractCapacity: 50, maxDemand: 43, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 53627, lastReading: 53353, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 42415.2, paymentAdjustment: -766.1, others: -0.1
  },
  { 
    id: '18', rocYear: 115, month: 1, usage: 11200, amount: 51500,
    billingPeriod: '114年12月27日至115年01月26日', contractCapacity: 50, maxDemand: 44, powerFactor: 100,
    meterNumber: '18-33-7005-08-7', currentReading: 53907, lastReading: 53627, usageCategory: 'C5',
    basicFee: 8660.0, flowFee: 43620.0, paymentAdjustment: -780.0, others: 0
  },
];

export const COLORS = {
  primary: '#10b981', // Emerald 500
  secondary: '#facc15', // Amber 400
  dark: '#064e3b', // Emerald 900
  text: '#374151',
  bg: '#f3f4f6'
};

// Simulated User Database
export const INITIAL_USERS = [
  { username: 'Steven', password: 'Steven', role: UserRole.ADMIN, name: 'Kai' }, // System Administrator
  { username: 'manager', password: 'manager', role: UserRole.MANAGER, name: '物業主任' }, // Property Manager
];

// Initial Data for Public Facilities
// Using monthly total records to match the provided table data
export const INITIAL_TOPUP_RECORDS: TopUpRecord[] = [
  // 2024 Data
  { id: '2024-10', date: '2024-10-01', points: 4630, amount: 4630 },
  { id: '2024-11', date: '2024-11-01', points: 7945, amount: 7945 },
  { id: '2024-12', date: '2024-12-01', points: 7440, amount: 7440 },
  
  // 2025 Data
  { id: '2025-01', date: '2025-01-01', points: 10550, amount: 10550 },
  { id: '2025-02', date: '2025-02-01', points: 3090, amount: 3090 },
  { id: '2025-03', date: '2025-03-01', points: 3700, amount: 3700 },
  { id: '2025-04', date: '2025-04-01', points: 1995, amount: 1995 },
  { id: '2025-05', date: '2025-05-01', points: 5610, amount: 5610 },
  { id: '2025-06', date: '2025-06-01', points: 1245, amount: 1245 },
  { id: '2025-07', date: '2025-07-01', points: 2100, amount: 2100 },
  { id: '2025-08', date: '2025-08-01', points: 1780, amount: 1780 },
  { id: '2025-09', date: '2025-09-01', points: 5140, amount: 5140 },
  { id: '2025-10', date: '2025-10-01', points: 1780, amount: 1780 },
  { id: '2025-11', date: '2025-11-01', points: 1990, amount: 1990 },
];

// 2025 (ROC 114) Data from the table - UPDATED TO AD YEARS (2025)
export const INITIAL_FACILITY_USAGE: FacilityUsageRecord[] = [
  { id: '1', year: 2025, month: 1, gymCount: 101, gameRoomCount: 19, kitchenCount: 2, avRoomCount: 32, k1SpaceCount: 0 },
  { id: '2', year: 2025, month: 2, gymCount: 120, gameRoomCount: 25, kitchenCount: 1, avRoomCount: 10, k1SpaceCount: 0 },
  { id: '3', year: 2025, month: 3, gymCount: 165, gameRoomCount: 23, kitchenCount: 0, avRoomCount: 9, k1SpaceCount: 0 },
  { id: '4', year: 2025, month: 4, gymCount: 149, gameRoomCount: 22, kitchenCount: 0, avRoomCount: 11, k1SpaceCount: 0 },
  { id: '5', year: 2025, month: 5, gymCount: 175, gameRoomCount: 26, kitchenCount: 0, avRoomCount: 14, k1SpaceCount: 0 },
  { id: '6', year: 2025, month: 6, gymCount: 174, gameRoomCount: 34, kitchenCount: 1, avRoomCount: 3, k1SpaceCount: 0 },
  { id: '7', year: 2025, month: 7, gymCount: 279, gameRoomCount: 36, kitchenCount: 0, avRoomCount: 7, k1SpaceCount: 0 },
  { id: '8', year: 2025, month: 8, gymCount: 275, gameRoomCount: 28, kitchenCount: 1, avRoomCount: 9, k1SpaceCount: 0 },
  { id: '9', year: 2025, month: 9, gymCount: 263, gameRoomCount: 16, kitchenCount: 3, avRoomCount: 7, k1SpaceCount: 0 },
  { id: '10', year: 2025, month: 10, gymCount: 286, gameRoomCount: 14, kitchenCount: 0, avRoomCount: 8, k1SpaceCount: 0 },
  { id: '11', year: 2025, month: 11, gymCount: 292, gameRoomCount: 12, kitchenCount: 0, avRoomCount: 7, k1SpaceCount: 0 },
  // 2026 Data
  { id: '12', year: 2026, month: 1, gymCount: 310, gameRoomCount: 15, kitchenCount: 2, avRoomCount: 8, k1SpaceCount: 5 },
  { id: '13', year: 2026, month: 2, gymCount: 280, gameRoomCount: 10, kitchenCount: 1, avRoomCount: 5, k1SpaceCount: 3 },
  { id: '14', year: 2026, month: 3, gymCount: 320, gameRoomCount: 18, kitchenCount: 3, avRoomCount: 12, k1SpaceCount: 8 },
];

export const INITIAL_PACKAGE_RECORDS: PackageRecord[] = [
  // 2024 Data
  { id: '1', year: 2024, month: 5, count: 27 },
  { id: '2', year: 2024, month: 6, count: 120 },
  { id: '3', year: 2024, month: 7, count: 167 },
  { id: '4', year: 2024, month: 8, count: 283 },
  { id: '5', year: 2024, month: 9, count: 371 },
  { id: '6', year: 2024, month: 10, count: 462 },
  { id: '7', year: 2024, month: 11, count: 645 },
  { id: '8', year: 2024, month: 12, count: 661 },
  // 2025 Data
  { id: '9', year: 2025, month: 1, count: 704 },
  { id: '10', year: 2025, month: 2, count: 516 },
  { id: '11', year: 2025, month: 3, count: 618 },
  { id: '12', year: 2025, month: 4, count: 601 },
  { id: '13', year: 2025, month: 5, count: 589 },
  { id: '14', year: 2025, month: 6, count: 664 },
  { id: '15', year: 2025, month: 7, count: 721 },
  { id: '16', year: 2025, month: 8, count: 669 },
  { id: '17', year: 2025, month: 9, count: 692 },
  { id: '18', year: 2025, month: 10, count: 680 },
  { id: '19', year: 2025, month: 11, count: 815 },
  // 2026 Data
  { id: '20', year: 2026, month: 1, count: 750 },
  { id: '21', year: 2026, month: 2, count: 580 },
  { id: '22', year: 2026, month: 3, count: 640 },
];