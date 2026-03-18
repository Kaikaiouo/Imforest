import React, { useState, useEffect, useMemo } from 'react';
import { PackageRecord, UserRole } from '../types';
import { api } from '../services/dataRepository';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface PackageManagementProps {
  userRole: UserRole;
  onRequestAction: (
    action: () => Promise<void> | void, 
    logInfo: { module: string, action: '新增' | '修改' | '刪除', description: string, diff?: string },
    confirmMessage: string
  ) => void;
}

interface EditState {
  isOpen: boolean;
  year: number;
  month: number;
  value: string;
}

const YEAR_COLORS: Record<number, string> = {
  2024: '#f59e0b', // Amber 500
  2025: '#3b82f6', // Blue 500
  2026: '#10b981', // Emerald 500
  2027: '#8b5cf6', // Violet 500
};

export const PackageManagement: React.FC<PackageManagementProps> = ({ userRole, onRequestAction }) => {
  const [records, setRecords] = useState<PackageRecord[]>([]);
  const [editState, setEditState] = useState<EditState>({ isOpen: false, year: 0, month: 0, value: '' });
  const [filterYear, setFilterYear] = useState<number | 'ALL'>(2026);

  useEffect(() => {
    const fetchData = async () => {
      const dbPackages = await api.getPackages();
      setRecords(dbPackages);
    };
    fetchData();
  }, []);

  const canEdit = userRole === UserRole.MANAGER || userRole === UserRole.ADMIN;

  // Transform data for Matrix View (Months x Years)
  const { years, matrixData, totals } = useMemo(() => {
    const yearsSet = new Set<number>(records.map(r => r.year));
    // Ensure we have at least 2024, 2025, 2026 like the example
    yearsSet.add(2024);
    yearsSet.add(2025);
    yearsSet.add(2026);
    const sortedYears = Array.from(yearsSet).sort((a: number, b: number) => a - b);

    // Prepare rows 1-12
    const rows = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const rowData: Record<number, number | null> = {};
      sortedYears.forEach(year => {
        const record = records.find(r => r.year === year && r.month === month);
        rowData[year] = record ? record.count : null;
      });
      return { month, data: rowData };
    });

    // Calculate Column Totals
    const colTotals: Record<number, number> = {};
    sortedYears.forEach(year => {
      colTotals[year] = records
        .filter(r => r.year === year)
        .reduce((sum, r) => sum + r.count, 0);
    });

    return { years: sortedYears, matrixData: rows, totals: colTotals };
  }, [records]);

  // Determine which years to display based on filter
  const displayYears = useMemo(() => {
    if (filterYear === 'ALL') return years;
    return years.filter(y => y === filterYear);
  }, [years, filterYear]);

  // Chart Data Preparation
  const chartConfig = useMemo(() => {
    const sortedYears = years;

    if (filterYear !== 'ALL') {
      // Single Year Mode: Just simple bars (one series)
      const yearData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const record = records.find(r => r.year === filterYear && r.month === month);
        return { name: `${month}月`, count: record ? record.count : 0 };
      });
      
      return {
        data: yearData,
        bars: [{ dataKey: 'count', name: `${filterYear}年`, fill: YEAR_COLORS[filterYear] || '#6b7280' }]
      };
    } else {
      // All Years Mode: Grouped Bars
      // Structure: { name: '1月', 2024: 10, 2025: 20 }
      const groupedData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const dataPoint: any = { name: `${month}月` };
        sortedYears.forEach(y => {
          const record = records.find(r => r.year === y && r.month === month);
          dataPoint[y] = record ? record.count : 0;
        });
        return dataPoint;
      });

      const bars = sortedYears.map(y => ({
        dataKey: y.toString(),
        name: `${y}年`,
        fill: YEAR_COLORS[y] || '#6b7280'
      }));

      return { data: groupedData, bars };
    }
  }, [records, filterYear, years]);

  const handleCellClick = (year: number, month: number, currentValue: number | null) => {
    if (!canEdit) return;
    setEditState({
      isOpen: true,
      year,
      month,
      value: currentValue !== null ? currentValue.toString() : ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { year, month, value } = editState;
    
    const currentValue = records.find(r => r.year === year && r.month === month)?.count ?? null;
    const newValueStr = value.toString().trim();
    const newValue = newValueStr === '' ? null : Number(newValueStr);
    
    // Validation
    if (newValue !== null && isNaN(newValue)) {
      alert('請輸入有效的數字');
      return;
    }

    const isDelete = newValue === null;
    const isUpdate = currentValue !== null && !isDelete;
    
    // If no change, just close
    if (currentValue === newValue) {
      setEditState({ ...editState, isOpen: false });
      return;
    }

    // Prepare Action
    let actionType: '新增' | '修改' | '刪除';
    let description = `${year}年 ${month}月 包裹數量`;
    let diff = '';

    if (isDelete) {
        actionType = '刪除';
        diff = `${currentValue} -> (空)`;
    } else if (isUpdate) {
        actionType = '修改';
        diff = `${currentValue} -> ${newValue}`;
    } else {
        actionType = '新增';
        diff = `(空) -> ${newValue}`;
    }

    const action = async () => {
      const existing = records.find(r => r.year === year && r.month === month);
      
      if (isDelete) {
        if (existing) await api.deletePackage(existing.id);
        setRecords(prev => prev.filter(r => r.id !== existing?.id));
      } else {
        const newRecord = {
          id: existing ? existing.id : crypto.randomUUID(),
          year,
          month,
          count: newValue!
        };
        await api.savePackage(newRecord);
        
        setRecords(prev => {
          const filtered = prev.filter(r => !(r.year === year && r.month === month));
          return [...filtered, newRecord];
        });
      }
      setEditState({ ...editState, isOpen: false });
    };

    const confirmMsg = `您即將${actionType} ${year}年 ${month}月 的包裹資料。\n\n變更內容: ${diff}`;
    
    // Close modal first so confirm modal shows up cleanly
    setEditState({ ...editState, isOpen: false });
    onRequestAction(action, { module: '包裹', action: actionType, description, diff }, confirmMsg);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
       {/* Chart Section */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px] relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-700 flex items-center">
            <span className="w-2 h-6 bg-amber-500 mr-2 rounded-full"></span>
            歷年包裹數量成長趨勢
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">選擇年份:</label>
            <select 
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5"
            >
              <option value="ALL">所有年份</option>
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartConfig.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{fontSize: 12}} />
            <YAxis />
            <Tooltip 
               contentStyle={{ backgroundColor: '#fff', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            {chartConfig.bars.map((bar) => (
              <Bar 
                key={bar.dataKey}
                dataKey={bar.dataKey} 
                name={bar.name} 
                fill={bar.fill} 
                radius={[4, 4, 0, 0]} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-gray-800">包裹管理月報表</h2>
           <p className="text-gray-500 text-sm">點擊表格內容即可進行編輯</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-center">
          <thead>
            <tr>
              <th className="p-3 border border-gray-300 bg-gray-100 text-gray-600 font-bold w-24"></th>
              {displayYears.map(year => (
                <th key={year} className="p-3 border border-gray-300 bg-blue-100 text-blue-900 font-bold text-lg">
                  {year}年
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixData.map(row => (
              <tr key={row.month}>
                <td className="p-3 border border-gray-300 bg-yellow-50 text-yellow-900 font-bold">
                  {row.month}月
                </td>
                {displayYears.map(year => {
                  const val = row.data[year];
                  const isNotOpen = year === 2024 && row.month >= 1 && row.month <= 4;
                  
                  let displayContent: React.ReactNode = val !== null ? val.toLocaleString() : '';
                  if (val === null && isNotOpen) {
                    displayContent = <span className="text-gray-400 text-xs">(尚未啟用)</span>;
                  }

                  return (
                    <td 
                      key={`${year}-${row.month}`}
                      onClick={() => handleCellClick(year, row.month, val)}
                      className={`p-3 border border-gray-300 font-medium transition-colors relative group ${
                        canEdit ? 'cursor-pointer hover:bg-blue-50 hover:shadow-inner' : ''
                      } ${val === null ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      {displayContent}
                      {canEdit && (
                        <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-50 text-blue-400">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-gray-200 font-bold">
              <td className="p-3 border border-gray-400 text-gray-800">總計</td>
              {displayYears.map(year => (
                <td key={`total-${year}`} className="p-3 border border-gray-400 text-gray-900">
                  {totals[year]?.toLocaleString() || 0}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-sm text-gray-500 text-left">
           單位 / 件
        </div>
      </div>

      {/* Custom Edit Modal */}
      {editState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]" onClick={() => setEditState({ ...editState, isOpen: false })}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-[fadeIn_0.1s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-600 p-4 text-white">
              <h3 className="font-bold">編輯包裹數量</h3>
              <p className="text-xs text-blue-100">{editState.year}年 {editState.month}月</p>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">數量 (件)</label>
              <input 
                type="number" 
                value={editState.value}
                onChange={e => setEditState({ ...editState, value: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                placeholder="輸入數量，留空代表刪除"
                autoFocus
              />
              <div className="mt-4 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditState({ ...editState, isOpen: false })}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow"
                >
                  確定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};