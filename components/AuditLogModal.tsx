
import React from 'react';
import { AuditLog } from '../types';

interface AuditLogModalProps {
  logs: AuditLog[];
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ logs, onClose }) => {
  // Sort logs by newest first
  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 bg-slate-800 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">系統操作紀錄</h2>
            <p className="text-slate-300 text-sm mt-1">追蹤所有新增、修改與刪除操作</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-0">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3">時間</th>
                <th className="px-6 py-3">操作人員</th>
                <th className="px-6 py-3">模組</th>
                <th className="px-6 py-3">動作</th>
                <th className="px-6 py-3">描述</th>
                <th className="px-6 py-3">數值變更</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedLogs.map((log) => (
                <tr key={log.id} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-gray-500">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {log.actorName}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      log.module === '公電' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      log.module === '包裹' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${
                      log.action === '新增' ? 'text-blue-600' :
                      log.action === '修改' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {log.diff || '-'}
                  </td>
                </tr>
              ))}
              {sortedLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    尚無操作紀錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
