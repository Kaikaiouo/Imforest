import React, { useState, useEffect } from 'react';
import { AppTab, TabSettings } from '../types';
import { api } from '../services/dataRepository';

interface SystemSettingsModalProps {
  onClose: () => void;
  onSettingsUpdate: (settings: TabSettings) => void;
  currentSettings: TabSettings;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ 
  onClose, 
  onSettingsUpdate,
  currentSettings 
}) => {
  const [settings, setSettings] = useState<TabSettings>(currentSettings);

  const handleToggle = (tab: AppTab) => {
    setSettings(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }));
  };

  const handleSave = async () => {
    await api.saveTabSettings(settings);
    onSettingsUpdate(settings);
    onClose();
  };

  const tabLabels: Record<AppTab, string> = {
    [AppTab.ELECTRICITY]: '公電管理',
    [AppTab.WATER]: '公水管理',
    [AppTab.PACKAGES]: '包裹管理',
    [AppTab.FACILITIES]: '公設管理'
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">系統頁籤設定</h2>
            <p className="text-slate-400 text-xs mt-1">控制前台顯示的頁籤項目</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {(Object.keys(tabLabels) as AppTab[]).map(tab => (
            <div key={tab} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-medium text-gray-700">{tabLabels[tab]}</span>
              <button
                onClick={() => handleToggle(tab)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings[tab] ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[tab] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md transition-colors font-medium"
          >
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
};
