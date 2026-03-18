
export interface BillData {
  id: string;
  rocYear: number; // e.g., 113
  month: number;   // e.g., 10 (Adjusted to be the usage end month)
  usage: number;   // e.g., 11040 (kWh)
  amount: number;  // e.g., 49041 (TWD)
  
  // Detailed fields
  billingPeriod?: string;    // e.g., "113年08月29日至113年09月26日"
  contractCapacity?: number; // 經常契約容量
  maxDemand?: number;        // 經常最高需量
  powerFactor?: number;      // 功率因數
  
  // New Complete Fields
  meterNumber?: string;      // 電號
  currentReading?: number;   // 本期指數
  lastReading?: number;      // 上期指數
  usageCategory?: string;    // 用電種類 (e.g., C5) - Replaced multiplier
  paymentDeadline?: string;  // 繳費期限

  // Breakdown for formula
  basicFee?: number;         // 基本電費
  flowFee?: number;          // 流動電費
  paymentAdjustment?: number; // 功率因數調整費 (Usually negative)
  others?: number;           // 其他 (超約附加費/其他)
}

export interface ChartDataPoint {
  name: string; 
  usage: number;
  amount: number;
  year: number;
  month: number;
}

export enum ChartType {
  OVERVIEW = 'OVERVIEW',
  COST_COMPARE = 'COST_COMPARE',
  USAGE_COMPARE = 'USAGE_COMPARE',
  HOUSEHOLD_SHARE = 'HOUSEHOLD_SHARE'
}

export enum UserRole {
  GUEST = 'GUEST',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN' // System Maintainer
}

export interface User {
  username: string;
  role: UserRole;
  name?: string; // Chinese Name
  password?: string;
}

// New Types for Management System
export enum AppTab {
  ELECTRICITY = 'ELECTRICITY', // 公電
  WATER = 'WATER',             // 公水
  PACKAGES = 'PACKAGES',       // 包裹
  FACILITIES = 'FACILITIES'    // 公設
}

export interface TopUpRecord {
  id: string;
  date: string; // YYYY-MM-DD
  points: number;
  amount: number;
  note?: string;
}

export interface FacilityUsageRecord {
  id: string;
  year: number; // AD Year (e.g., 2025)
  month: number;
  gymCount: number;       // 健身房
  gameRoomCount: number;  // 兒童遊戲室 (New)
  kitchenCount: number;   // 廚藝教室
  avRoomCount: number;    // 視聽室 (Renamed from KTV)
  k1SpaceCount: number;   // K1旁空地 (New)
}

export interface PackageRecord {
  id: string;
  year: number; // AD Year (e.g., 2024)
  month: number;
  count: number;
}

export interface TabSettings {
  [AppTab.ELECTRICITY]: boolean;
  [AppTab.WATER]: boolean;
  [AppTab.PACKAGES]: boolean;
  [AppTab.FACILITIES]: boolean;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  module: string; // '公電', '包裹', '公設'
  action: '新增' | '修改' | '刪除';
  description: string;
  diff?: string; // e.g., "500 -> 600"
}