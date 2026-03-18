import React, { useState, useRef, useEffect } from 'react';
import { BillData, ChartType, User, UserRole, AppTab, AuditLog, TabSettings } from './types';
// INITIAL_BILLS and others are now only used as fallback or not at all, we load from DB
import { AppCharts } from './components/Charts';
import { BillList } from './components/BillList';
import { analyzeBillImage } from './services/geminiService';
import { api } from './services/dataRepository';
import { StatCard } from './components/StatCard';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { PublicFacilities } from './components/PublicFacilities';
import { PackageManagement } from './components/PackageManagement';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AuditLogModal } from './components/AuditLogModal';
import { SystemSettingsModal } from './components/SystemSettingsModal';

const App: React.FC = () => {
  const [bills, setBills] = useState<BillData[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ELECTRICITY);
  const [activeChart, setActiveChart] = useState<ChartType>(ChartType.OVERVIEW);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [showSystemSettingsModal, setShowSystemSettingsModal] = useState(false);

  // Tab Visibility Settings
  const [tabSettings, setTabSettings] = useState<TabSettings>({
    [AppTab.ELECTRICITY]: true,
    [AppTab.WATER]: true,
    [AppTab.PACKAGES]: true,
    [AppTab.FACILITIES]: true
  });

  // Audit Logs State (Loaded from DB now)
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Data from Database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbBills = await api.getBills();
        setBills(dbBills);
        
        const dbLogs = await api.getAuditLogs();
        setLogs(dbLogs);

        const dbTabSettings = await api.getTabSettings();
        setTabSettings(dbTabSettings);

        // Restore User Session
        const savedUser = localStorage.getItem('APP_SESSION');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Failed to fetch data from DB:", error);
      }
    };
    fetchData();

    // Listen for Bill Updates from Modal
    const handleBillUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<BillData>;
      const updatedBill = customEvent.detail;
      // In a real app we might re-fetch, but here we update state optimistically
      setBills(prevBills => prevBills.map(b => b.id === updatedBill.id ? updatedBill : b));
    };

    window.addEventListener('APP_UPDATE_BILL', handleBillUpdate);
    return () => {
      window.removeEventListener('APP_UPDATE_BILL', handleBillUpdate);
    }
  }, []);

  // Helper to add log to DB and State
  const addLog = async (logData: Omit<AuditLog, 'id' | 'timestamp' | 'actorName'>) => {
    if (!currentUser) return;
    
    const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });
    const actorName = currentUser.name || currentUser.username;

    // 1. Save to DB
    try {
      await api.addAuditLog({
        ...logData,
        timestamp,
        actorName
      });
      
      // 2. Refresh Logs (or optimistic update)
      const newLogs = await api.getAuditLogs();
      setLogs(newLogs);
    } catch (e) {
      console.error("Failed to save log", e);
    }
  };

  const handleActionWithConfirm = (
    action: () => Promise<void> | void,
    logInfo: { module: string, action: '新增' | '修改' | '刪除', description: string, diff?: string },
    confirmMessage: string
  ) => {
    setConfirmConfig({
      isOpen: true,
      message: confirmMessage,
      onConfirm: async () => {
        try {
          await action(); // Wait for the DB action
          await addLog(logInfo); // Then log
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (e) {
          alert("操作失敗，請稍後再試。\n" + e);
        }
      }
    });
  };


  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('APP_SESSION', JSON.stringify(user));
  };

  const handleLogoutClick = () => {
    setConfirmConfig({
      isOpen: true,
      message: "您確定要登出系統嗎?",
      onConfirm: () => {
        setCurrentUser(null);
        localStorage.removeItem('APP_SESSION');
        setShowUserManagementModal(false);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Bill Deletion Logic
  const handleDeleteBill = async (id: string) => {
    await api.deleteBill(id);
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Call Gemini Service
      const result = await analyzeBillImage(file);
      
      // 2. Validate Result
      if (result.rocYear && result.month && result.amount !== undefined && result.usage !== undefined) {
        
        if (result.month < 1 || result.month > 12) {
          throw new Error(`辨識出的月份 (${result.month}) 不合法，請確認圖片內容`);
        }

        // Check for duplicate
        const exists = bills.some(b => b.rocYear === result.rocYear && b.month === result.month);
        if (exists) {
           throw new Error(`已經存在 ${result.rocYear}年 ${result.month}月的資料`);
        }

        const newBill: BillData = {
          id: crypto.randomUUID(),
          rocYear: result.rocYear!,
          month: result.month!,
          usage: result.usage!,
          amount: result.amount!,
          billingPeriod: result.billingPeriod,
          contractCapacity: result.contractCapacity,
          maxDemand: result.maxDemand,
          powerFactor: result.powerFactor,
          meterNumber: result.meterNumber,
          currentReading: result.currentReading,
          lastReading: result.lastReading,
          usageCategory: result.usageCategory,
          paymentDeadline: result.paymentDeadline,
          basicFee: result.basicFee,
          flowFee: result.flowFee,
          paymentAdjustment: result.paymentAdjustment,
          others: result.others
        };

        // Save to DB
        await api.saveBill(newBill);
        
        // Update State & Log
        setBills(prev => [...prev, newBill]);
        await addLog({
          module: '公電',
          action: '新增',
          description: `匯入 ${result.rocYear}年 ${result.month}月 電費單`,
          diff: `金額: ${result.amount}, 度數: ${result.usage}`
        });

        alert(`成功匯入 ${result.rocYear}年 ${result.month}月 電費單！`);
      } else {
        throw new Error("無法從圖片中完整辨識所需欄位，請確認圖片清晰度。");
      }
    } catch (error: any) {
      setUploadError(error.message || "圖片辨識失敗，請重試");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Check Rights
  const canEdit = currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.ADMIN;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Calculate Stats
  const latestBill = bills.length > 0 
    ? [...bills].sort((a, b) => (b.rocYear * 12 + b.month) - (a.rocYear * 12 + a.month))[0] 
    : null;
  
  const totalSpent = bills.reduce((acc, curr) => acc + curr.amount, 0);
  const avgUsage = bills.length > 0 ? Math.round(bills.reduce((acc, curr) => acc + curr.usage, 0) / bills.length) : 0;

  return (
    <div className="min-h-screen pb-20 bg-[#f3f4f6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              森
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">向森青社區 <span className="text-gray-400 font-normal text-sm">| 管理系統</span></h1>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight sm:hidden">向森青社區</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden md:block">
                  嗨, <span className="font-bold text-emerald-600">{currentUser.name || currentUser.username}</span> 
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded ml-2 text-gray-500">
                    {currentUser.role === UserRole.ADMIN ? '系統管理員' : '物業管理員'}
                  </span>
                </span>
                
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowAuditLogModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                      title="系統紀錄"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="hidden sm:inline">紀錄</span>
                    </button>
                    <button
                      onClick={() => setShowSystemSettingsModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                      title="頁籤設定"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="hidden sm:inline">設定</span>
                    </button>
                    <button
                      onClick={() => setShowUserManagementModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-900 shadow hover:shadow-md transition-colors"
                    >
                      使用者管理
                    </button>
                  </>
                )}
                
                <button 
                  onClick={handleLogoutClick}
                  className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="登出"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="text-emerald-600 font-medium text-sm hover:text-emerald-700 px-3 py-1.5 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                管理員登入
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 -mb-px overflow-x-auto scrollbar-hide">
            {[
              { id: AppTab.ELECTRICITY, label: '公電管理' },
              { id: AppTab.WATER, label: '公水管理' },
              { id: AppTab.PACKAGES, label: '包裹管理' },
              { id: AppTab.FACILITIES, label: '公設管理' }
            ].filter(tab => tabSettings[tab.id as AppTab]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AppTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-[fadeIn_0.3s_ease-out]">
        
        {/* PUBLIC ELECTRICITY TAB */}
        {activeTab === AppTab.ELECTRICITY && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">社區公共用電</h2>
                <p className="text-gray-500 text-sm">監控社區公共用電與費用趨勢</p>
              </div>
               {canEdit && (
                <div className="flex gap-2">
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isUploading 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow hover:shadow-md'
                      }`}
                    >
                      {isUploading ? '辨識中...' : '+ 匯入電費單'}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                </div>
               )}
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-pulse">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="最新一期金額"
                value={latestBill ? `$${latestBill.amount.toLocaleString()}` : "NT$0"}
                trend={latestBill ? `${latestBill.rocYear + 1911}年${latestBill.month}月帳單` : "-"}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                colorClass="bg-emerald-500"
              />
              <StatCard 
                title="平均用電度數"
                value={`${avgUsage.toLocaleString()} kWh`}
                trend="歷史平均"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                colorClass="bg-yellow-400"
              />
              <StatCard 
                title="累計監控支出"
                value={`$${totalSpent.toLocaleString()}`}
                trend={`${bills.length} 期帳單`}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                colorClass="bg-blue-500"
              />
            </div>

            {/* Charts Section */}
            <section>
              <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { id: ChartType.OVERVIEW, label: '總覽分析' },
                  { id: ChartType.COST_COMPARE, label: '金額同期比較' },
                  { id: ChartType.USAGE_COMPARE, label: '用電同期比較' },
                  { id: ChartType.HOUSEHOLD_SHARE, label: '每戶分攤' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChart(tab.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeChart === tab.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <AppCharts data={bills} type={activeChart} />
            </section>

            {/* Data Table */}
            <section>
              <BillList 
                data={bills} 
                onDelete={handleDeleteBill} 
                userRole={currentUser?.role || UserRole.GUEST}
                onRequestAction={handleActionWithConfirm}
              />
            </section>
          </div>
        )}

        {/* PACKAGE MANAGEMENT TAB */}
        {activeTab === AppTab.PACKAGES && (
          <PackageManagement 
            userRole={currentUser?.role || UserRole.GUEST}
            onRequestAction={handleActionWithConfirm}
          />
        )}

        {/* PUBLIC FACILITIES TAB */}
        {activeTab === AppTab.FACILITIES && (
          <PublicFacilities 
            userRole={currentUser?.role || UserRole.GUEST} 
            onRequestAction={handleActionWithConfirm}
          />
        )}

        {/* Placeholder Tabs */}
        {activeTab === AppTab.WATER && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
             <div className="bg-gray-100 p-4 rounded-full mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </div>
             <h3 className="text-xl font-bold text-gray-700">功能開發中</h3>
             <p className="text-gray-500 mt-2">此模組尚未啟用，敬請期待。</p>
          </div>
        )}

      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onLogin={handleLogin} 
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* User Management Modal */}
      {showUserManagementModal && currentUser && (
        <UserManagementModal
          currentUser={currentUser}
          onClose={() => setShowUserManagementModal(false)}
          onUpdateCurrentUser={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('APP_SESSION', JSON.stringify(updatedUser));
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Audit Logs Modal */}
      {showAuditLogModal && (
        <AuditLogModal 
          logs={logs}
          onClose={() => setShowAuditLogModal(false)}
        />
      )}

      {/* System Settings Modal */}
      {showSystemSettingsModal && (
        <SystemSettingsModal
          currentSettings={tabSettings}
          onClose={() => setShowSystemSettingsModal(false)}
          onSettingsUpdate={(newSettings) => {
            setTabSettings(newSettings);
            // If current tab is hidden, switch to first visible
            if (!newSettings[activeTab]) {
              const firstVisible = (Object.keys(newSettings) as AppTab[]).find(k => newSettings[k]);
              if (firstVisible) setActiveTab(firstVisible);
            }
          }}
        />
      )}
    </div>
  );
};

export default App;