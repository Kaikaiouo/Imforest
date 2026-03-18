import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line
} from 'recharts';
import { UserRole, TopUpRecord, FacilityUsageRecord } from '../types';
import { api } from '../services/dataRepository';

interface PublicFacilitiesProps {
  userRole: UserRole;
  onRequestAction: (
    action: () => Promise<void> | void, // Updated signature to allow async
    logInfo: { module: string, action: '新增' | '修改' | '刪除', description: string, diff?: string },
    confirmMessage: string
  ) => void;
}

const YEAR_COLORS: Record<number, string> = {
  2024: '#f59e0b', // Amber 500
  2025: '#3b82f6', // Blue 500
  2026: '#10b981', // Emerald 500
  2027: '#8b5cf6', // Violet 500
};

export const PublicFacilities: React.FC<PublicFacilitiesProps> = ({ userRole, onRequestAction }) => {
  const [activeSubTab, setActiveSubTab] = useState<'TOPUP' | 'USAGE'>('TOPUP');
  
  // Data States
  const [topUps, setTopUps] = useState<TopUpRecord[]>([]);
  const [usages, setUsages] = useState<FacilityUsageRecord[]>([]);

  // Form States (Top Up)
  const [editingTopUpId, setEditingTopUpId] = useState<string | null>(null);
  const [topUpDate, setTopUpDate] = useState('');
  const [topUpPoints, setTopUpPoints] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  // Top Up Chart Filter
  const [topUpFilterYear, setTopUpFilterYear] = useState<number | 'ALL'>(2026);
  // Top Up Table Filter
  const [topUpTableYear, setTopUpTableYear] = useState<number>(2026);

  // Form States (Usage) - Default to 2026 (AD)
  const [usageYear, setUsageYear] = useState<number>(2026); 
  const [usageMonth, setUsageMonth] = useState<number>(1);
  const [gymCount, setGymCount] = useState('');
  const [gameRoomCount, setGameRoomCount] = useState('');
  const [kitchenCount, setKitchenCount] = useState('');
  const [avRoomCount, setAvRoomCount] = useState('');
  const [k1SpaceCount, setK1SpaceCount] = useState('');
  // Usage Chart Filter - Default to 2026 (AD)
  const [chartYear, setChartYear] = useState<number>(2026); 

  const canEdit = userRole === UserRole.MANAGER || userRole === UserRole.ADMIN;

  // Initialize Data from DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbTopUps = await api.getTopUps();
        setTopUps(dbTopUps);
        const dbUsages = await api.getFacilityUsages();
        setUsages(dbUsages);
      } catch (e) {
        console.error("Failed to load facility data", e);
      }
    };
    fetchData();
  }, []);

  // --- Handlers for Top Ups ---
  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpDate || !topUpPoints || !topUpAmount) return;

    if (editingTopUpId) {
      // Handle Edit
      const existing = topUps.find(r => r.id === editingTopUpId);
      if (!existing) return;

      const action = async () => {
        const updatedRecord = {
          ...existing,
          date: topUpDate,
          points: Number(topUpPoints),
          amount: Number(topUpAmount)
        };
        
        await api.saveTopUp(updatedRecord);
        
        // Optimistic Update
        const updated = topUps.map(r => r.id === editingTopUpId ? updatedRecord : r);
        setTopUps(updated);
        resetTopUpForm();
      };

      const diff = `日期:${existing.date}->${topUpDate}, 點數:${existing.points}->${topUpPoints}, 金額:${existing.amount}->${topUpAmount}`;
      const confirmMsg = `確定要修改儲值紀錄?\n${diff}`;
      onRequestAction(action, { module: '公設', action: '修改', description: `修改儲值紀錄 ${topUpDate}`, diff }, confirmMsg);

    } else {
      // Handle Add
      const action = async () => {
        const newRecord: TopUpRecord = {
          id: crypto.randomUUID(),
          date: topUpDate,
          points: Number(topUpPoints),
          amount: Number(topUpAmount)
        };
  
        await api.saveTopUp(newRecord);

        const updated = [newRecord, ...topUps];
        setTopUps(updated);
        resetTopUpForm();
      };
  
      const description = `儲值 ${topUpPoints}點 ($${topUpAmount})`;
      const confirmMsg = `確定要新增儲值紀錄?\n日期: ${topUpDate}\n點數: ${topUpPoints}\n金額: $${topUpAmount}`;
  
      onRequestAction(action, { module: '公設', action: '新增', description, diff: `(新) ${description}` }, confirmMsg);
    }
  };

  const handleEditTopUp = (record: TopUpRecord) => {
    setEditingTopUpId(record.id);
    setTopUpDate(record.date);
    setTopUpPoints(record.points.toString());
    setTopUpAmount(record.amount.toString());
  };

  const handleDeleteTopUp = (record: TopUpRecord) => {
    const action = async () => {
      await api.deleteTopUp(record.id);
      const updated = topUps.filter(r => r.id !== record.id);
      setTopUps(updated);
      if (editingTopUpId === record.id) resetTopUpForm();
    };

    const description = `刪除儲值紀錄 ${record.date}`;
    const diff = `刪除: ${record.points}點, $${record.amount}`;
    const confirmMsg = `確定要刪除 ${record.date} 的儲值紀錄嗎？\n此動作無法復原。`;

    onRequestAction(action, { module: '公設', action: '刪除', description, diff }, confirmMsg);
  };

  const resetTopUpForm = () => {
    setEditingTopUpId(null);
    setTopUpDate('');
    setTopUpPoints('');
    setTopUpAmount('');
  };

  // Prepare Top Up Chart Data (Yearly Comparison)
  const topUpYears = useMemo(() => {
    const years = new Set(topUps.map(t => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear());
    years.add(2024);
    years.add(2025);
    years.add(2026);
    return Array.from(years).sort((a: number, b: number) => a - b);
  }, [topUps]);

  const topUpChartConfig = useMemo(() => {
    const chartData = Array.from({length: 12}, (_, i) => {
       const month = i + 1;
       const dataPoint: any = { name: `${month}月` };
       
       if (topUpFilterYear === 'ALL') {
         topUpYears.forEach(year => {
            const total = topUps
              .filter(t => {
                const d = new Date(t.date);
                return d.getFullYear() === year && (d.getMonth() + 1) === month;
              })
              .reduce((sum, t) => sum + t.amount, 0);
            dataPoint[year] = total;
         });
       } else {
          const total = topUps
              .filter(t => {
                const d = new Date(t.date);
                return d.getFullYear() === Number(topUpFilterYear) && (d.getMonth() + 1) === month;
              })
              .reduce((sum, t) => sum + t.amount, 0);
          dataPoint.amount = total;
       }
       return dataPoint;
    });

    const bars = topUpFilterYear === 'ALL' 
      ? topUpYears.map(year => ({
          dataKey: year.toString(),
          name: `${year}年`,
          fill: YEAR_COLORS[year] || '#6366f1'
        }))
      : [{ dataKey: 'amount', name: `${topUpFilterYear}年`, fill: YEAR_COLORS[Number(topUpFilterYear)] || '#6366f1' }];

    return { data: chartData, bars };
  }, [topUps, topUpFilterYear, topUpYears]);

  // Top Up Matrix Data (Months x Years)
  const topUpMatrix = useMemo(() => {
    const sortedYears = topUpYears;
    const rows = Array.from({length: 12}, (_, i) => {
      const month = i + 1;
      const rowData: any = { month };
      sortedYears.forEach(year => {
        const monthlyTotal = topUps
          .filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
          })
          .reduce((sum, t) => sum + t.amount, 0);
         rowData[year] = monthlyTotal > 0 ? monthlyTotal : null;
      });
      return rowData;
    });

    const totals: any = { month: '總計' };
    sortedYears.forEach(year => {
      totals[year] = topUps
        .filter(t => new Date(t.date).getFullYear() === year)
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return { rows, totals, sortedYears };
  }, [topUps, topUpYears]);


  // --- Handlers for Usage ---
  const handleSaveUsageClick = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if record exists for this Year/Month
    const existingIndex = usages.findIndex(u => u.year === usageYear && u.month === usageMonth);
    const existing = usages[existingIndex];
    
    const action = async () => {
      const newRecord: FacilityUsageRecord = {
        id: existingIndex !== -1 ? existing.id : crypto.randomUUID(),
        year: usageYear,
        month: usageMonth,
        gymCount: Number(gymCount),
        gameRoomCount: Number(gameRoomCount),
        kitchenCount: Number(kitchenCount),
        avRoomCount: Number(avRoomCount),
        k1SpaceCount: Number(k1SpaceCount)
      };

      await api.saveFacilityUsage(newRecord);

      let updated = [...usages];
      if (existingIndex !== -1) {
        updated[existingIndex] = newRecord;
      } else {
        updated.push(newRecord);
      }
      setUsages(updated);
    };

    const actionType = existingIndex !== -1 ? '修改' : '新增';
    const description = `${usageYear}年${usageMonth}月 公設使用統計`;
    
    // Build Diff String
    const changes = [];
    if (existing) {
        if (Number(gymCount) !== existing.gymCount) changes.push(`健身房:${existing.gymCount}->${gymCount}`);
        if (Number(gameRoomCount) !== existing.gameRoomCount) changes.push(`遊戲室:${existing.gameRoomCount}->${gameRoomCount}`);
        if (Number(kitchenCount) !== existing.kitchenCount) changes.push(`廚藝:${existing.kitchenCount}->${kitchenCount}`);
        if (Number(avRoomCount) !== existing.avRoomCount) changes.push(`視聽室:${existing.avRoomCount}->${avRoomCount}`);
        if (Number(k1SpaceCount) !== existing.k1SpaceCount) changes.push(`K1:${existing.k1SpaceCount}->${k1SpaceCount}`);
    } else {
        changes.push(`健身房:${gymCount}, 遊戲室:${gameRoomCount}, 廚藝:${kitchenCount}, 視聽室:${avRoomCount}, K1:${k1SpaceCount}`);
    }
    const diff = changes.join(', ');
    
    const confirmMsg = `確定要${actionType} ${usageYear}年${usageMonth}月 的公設使用資料嗎？\n\n健身房: ${gymCount}\n兒童遊戲室: ${gameRoomCount}\n廚藝教室: ${kitchenCount}\n視聽室: ${avRoomCount}\nK1旁空地: ${k1SpaceCount}`;

    onRequestAction(action, { module: '公設', action: actionType, description, diff }, confirmMsg);
  };
  
  // Custom Tooltip for Usage Chart
  const CustomUsageTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm">
           <p className="font-bold text-gray-700 mb-2">{label}</p>
           {payload.map((entry: any, index: number) => (
             <div key={index} className="flex items-center justify-between gap-4 mb-1">
               <span className="text-gray-600 flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color}}></div>
                 {entry.name}:
               </span>
               <span className="font-mono font-medium">{entry.value} 次</span>
             </div>
           ))}
        </div>
      );
    }
    return null;
  };

  // Populate form on table row click
  const handleUsageRowClick = (row: any) => {
    if (!canEdit) return;
    
    setUsageYear(chartYear);
    setUsageMonth(row.month);
    setGymCount(row.gym !== null ? String(row.gym) : '');
    setGameRoomCount(row.game !== null ? String(row.game) : '');
    setKitchenCount(row.kitchen !== null ? String(row.kitchen) : '');
    setAvRoomCount(row.av !== null ? String(row.av) : '');
    setK1SpaceCount(row.k1 !== null ? String(row.k1) : '');

    const formElement = document.getElementById('usage-form-section');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Prepare Usage Chart Data (1-12 Months for selected Year)
  const usageChartData = useMemo(() => {
    const dataForYear = usages.filter(u => u.year === chartYear);
    
    // Create 1-12 month structure
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const record = dataForYear.find(d => d.month === m);
      // Use null for missing data to create line break (or prevent zero-drop)
      if (!record) {
        return {
           name: `${m}月`,
           month: m,
           gym: null,
           game: null,
           kitchen: null,
           av: null,
           k1: null
        };
      }
      return {
        name: `${m}月`,
        month: m,
        gym: record.gymCount,
        game: record.gameRoomCount,
        kitchen: record.kitchenCount,
        av: record.avRoomCount,
        k1: record.k1SpaceCount
      };
    });
  }, [usages, chartYear]);


  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-1">
        <button 
          onClick={() => setActiveSubTab('TOPUP')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSubTab === 'TOPUP' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          公設點數加值收入統計
        </button>
        <button 
          onClick={() => setActiveSubTab('USAGE')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSubTab === 'USAGE' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          公設使用次數
        </button>
      </div>

      {activeSubTab === 'TOPUP' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700 flex items-center">
                <span className="w-2 h-6 bg-indigo-500 mr-2 rounded-full"></span>
                每月儲值收入趨勢
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">選擇年份:</label>
                <select 
                  value={topUpFilterYear}
                  onChange={(e) => setTopUpFilterYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"
                >
                  <option value="ALL">所有年份</option>
                  {topUpYears.map(year => (
                    <option key={year} value={year}>{year}年</option>
                  ))}
                </select>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={topUpChartConfig.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip 
                  formatter={(val: number) => `$${val.toLocaleString()}`}
                  contentStyle={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                {topUpChartConfig.bars.map(bar => (
                   <Bar key={bar.dataKey} dataKey={bar.dataKey} name={bar.name} fill={bar.fill} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Report Matrix Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-gray-700">儲值金額月報表</h4>
               <div className="flex items-center gap-2">
                 <label className="text-sm text-gray-500">選擇年份:</label>
                 <select 
                   value={topUpTableYear}
                   onChange={(e) => setTopUpTableYear(Number(e.target.value))}
                   className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"
                 >
                   {topUpYears.map(year => (
                     <option key={year} value={year}>{year}年</option>
                   ))}
                 </select>
                 <span className="text-xs text-gray-500 ml-2">單位 / 元</span>
               </div>
             </div>
             
             <table className="w-full min-w-[600px] border-collapse text-center text-sm">
                <thead>
                   <tr>
                      <th className="p-3 border border-gray-300 bg-gray-100 text-gray-600 font-bold w-24">月份</th>
                      <th className="p-3 border border-gray-300 bg-indigo-100 text-indigo-900 font-bold text-lg">{topUpTableYear}年</th>
                   </tr>
                </thead>
                <tbody>
                   {topUpMatrix.rows.map((row: any) => (
                      <tr key={row.month}>
                         <td className="p-3 border border-gray-300 bg-yellow-50 text-yellow-900 font-bold">{row.month}月</td>
                         <td className="p-3 border border-gray-300 bg-white">
                            {row[topUpTableYear] !== null ? row[topUpTableYear].toLocaleString() : ''}
                         </td>
                      </tr>
                   ))}
                   {/* Total Row */}
                   <tr className="bg-gray-200 font-bold">
                      <td className="p-3 border border-gray-400 text-gray-800">總計</td>
                      <td className="p-3 border border-gray-400 text-gray-900">
                         {topUpMatrix.totals[topUpTableYear]?.toLocaleString() || 0}
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Input Form */}
             {canEdit && (
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-4">{editingTopUpId ? '編輯儲值紀錄' : '新增儲值記錄'}</h4>
                <form onSubmit={handleTopUpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">日期</label>
                    <input 
                      type="date" 
                      value={topUpDate}
                      onChange={e => setTopUpDate(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">儲值點數</label>
                    <input 
                      type="number" 
                      value={topUpPoints}
                      onChange={e => setTopUpPoints(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="例如: 1000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-800 mb-1">金額 (NT$)</label>
                    <input 
                      type="number" 
                      value={topUpAmount}
                      onChange={e => setTopUpAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="例如: 1000"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingTopUpId && (
                      <button 
                        type="button" 
                        onClick={resetTopUpForm}
                        className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-300 transition"
                      >
                        取消
                      </button>
                    )}
                    <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition">
                      {editingTopUpId ? '儲存變更' : '新增紀錄'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recent History Table - Only visible to admins/managers */}
            {canEdit && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                <h4 className="font-bold text-gray-700 mb-4">近期儲值紀錄 (明細)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">日期</th>
                        <th className="px-4 py-3 text-right">點數</th>
                        <th className="px-4 py-3 text-right">金額</th>
                        <th className="px-4 py-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...topUps].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 10).map(record => (
                        <tr key={record.id} className={`border-b hover:bg-gray-50 ${editingTopUpId === record.id ? 'bg-indigo-50' : ''}`}>
                          <td className="px-4 py-3">{record.date}</td>
                          <td className="px-4 py-3 text-right">{record.points.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-indigo-600">${record.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                             <div className="flex justify-end gap-2">
                               <button 
                                onClick={() => handleEditTopUp(record)}
                                className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-100"
                                title="編輯"
                               >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                               </button>
                               <button 
                                onClick={() => handleDeleteTopUp(record)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100"
                                title="刪除"
                               >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {topUps.length === 0 && (
                         <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-400">尚無紀錄</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'USAGE' && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[450px] relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700 flex items-center">
                <span className="w-2 h-6 bg-pink-500 mr-2 rounded-full"></span>
                公設使用次數年度統計
              </h3>
              <select 
                value={chartYear}
                onChange={e => setChartYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg p-1 text-sm"
              >
                <option value={2024}>2024年</option>
                <option value={2025}>2025年</option>
                <option value={2026}>2026年</option>
              </select>
            </div>
            
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={usageChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomUsageTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="gym" name="健身房" stroke="#ef4444" strokeWidth={2} connectNulls={false} dot={{r:4}} />
                <Line type="monotone" dataKey="game" name="兒童遊戲室" stroke="#f97316" strokeWidth={2} connectNulls={false} dot={{r:4}} />
                <Line type="monotone" dataKey="kitchen" name="廚藝教室" stroke="#10b981" strokeWidth={2} connectNulls={false} dot={{r:4}} />
                <Line type="monotone" dataKey="av" name="視聽室" stroke="#8b5cf6" strokeWidth={2} connectNulls={false} dot={{r:4}} />
                <Line type="monotone" dataKey="k1" name="K1旁空地" stroke="#6b7280" strokeWidth={2} connectNulls={false} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-gray-700">{chartYear}年 公設使用明細</h4>
               {canEdit && <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded border border-blue-100">提示：點擊表格列可載入資料進行編輯</span>}
             </div>
             <table className="w-full text-sm text-center border-collapse">
                <thead>
                   <tr className="bg-gray-100 text-gray-600">
                      <th className="p-3 border border-gray-200">月份</th>
                      <th className="p-3 border border-gray-200">健身房</th>
                      <th className="p-3 border border-gray-200">兒童遊戲室</th>
                      <th className="p-3 border border-gray-200">廚藝教室</th>
                      <th className="p-3 border border-gray-200">視聽室</th>
                      <th className="p-3 border border-gray-200">K1旁空地</th>
                   </tr>
                </thead>
                <tbody>
                   {usageChartData.map((row) => (
                      <tr 
                        key={row.name} 
                        onClick={() => handleUsageRowClick(row)}
                        className={`border-b border-gray-200 transition-colors ${canEdit ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                        title={canEdit ? "點擊以編輯此月份資料" : ""}
                      >
                         <td className="p-3 font-medium text-gray-800">{row.name}</td>
                         <td className="p-3 text-gray-600">{row.gym !== null ? row.gym : '-'}</td>
                         <td className="p-3 text-gray-600">{row.game !== null ? row.game : '-'}</td>
                         <td className="p-3 text-gray-600">{row.kitchen !== null ? row.kitchen : '-'}</td>
                         <td className="p-3 text-gray-600">{row.av !== null ? row.av : '-'}</td>
                         <td className="p-3 text-gray-600">
                            {/* K1 Space Logic: Display 'Not Enabled' for first half of 2025 if value is 0 or null */}
                            {chartYear === 2025 && row.month <= 6 && (row.k1 === 0 || row.k1 === null) 
                               ? <span className="text-gray-400 text-xs">(尚未啟用)</span>
                               : (row.k1 !== null ? row.k1 : '-')
                            }
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* Input Section */}
          {canEdit && (
            <div id="usage-form-section" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-500">
              <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">登錄 / 編輯使用次數</h4>
              <form onSubmit={handleSaveUsageClick} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
                <div className="lg:col-span-1">
                   <label className="block text-sm font-medium text-gray-600 mb-1">年份</label>
                   <select 
                    value={usageYear} 
                    onChange={e => setUsageYear(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                  >
                     <option value={2024}>2024</option>
                     <option value={2025}>2025</option>
                     <option value={2026}>2026</option>
                   </select>
                </div>
                <div className="lg:col-span-1">
                   <label className="block text-sm font-medium text-gray-600 mb-1">月份</label>
                   <select 
                    value={usageMonth} 
                    onChange={e => setUsageMonth(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                  >
                     {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                       <option key={m} value={m}>{m}月</option>
                     ))}
                   </select>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">健身房</label>
                  <input type="number" value={gymCount} onChange={e => setGymCount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" placeholder="0" />
                </div>
                 <div className="lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">遊戲室</label>
                  <input type="number" value={gameRoomCount} onChange={e => setGameRoomCount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" placeholder="0" />
                </div>
                 <div className="lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">廚藝教室</label>
                  <input type="number" value={kitchenCount} onChange={e => setKitchenCount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" placeholder="0" />
                </div>
                 <div className="lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">視聽室</label>
                  <input type="number" value={avRoomCount} onChange={e => setAvRoomCount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" placeholder="0" />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">K1旁空地</label>
                  <input type="number" value={k1SpaceCount} onChange={e => setK1SpaceCount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" placeholder="0" />
                </div>
                <div className="lg:col-span-1">
                  <button type="submit" className="w-full bg-slate-800 text-white font-medium py-2 rounded-lg hover:bg-slate-900 transition">
                    儲存
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};