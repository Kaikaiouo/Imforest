import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/dataRepository';

interface UserManagementModalProps {
  currentUser: User;
  onClose: () => void;
  onUpdateCurrentUser: (user: User) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ currentUser, onClose, onUpdateCurrentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MANAGER);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const dbUsers = await api.getUsers();
      setUsers(dbUsers);
    } catch (e) {
      console.error("Failed to load users", e);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setRole(UserRole.MANAGER);
    setEditingUser(null);
    setIsEditing(false);
    setError('');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password || !name) {
      setError('請填寫所有必填欄位');
      setLoading(false);
      return;
    }

    try {
      if (isEditing && editingUser) {
        // Edit Mode
        // Check if username changed (which might act as new user if PK changed, but we rely on PK not changing here ideally, or delete/insert)
        // Since username is PK in DB design, we treat username as immutable for Update, or Insert new/Delete old.
        // For simplicity, we assume username is immutable in Edit unless implemented as Delete+Add.
        // Let's stick to update details.
        
        await api.saveUser({ username, password, role, name }, false);
        
        if (editingUser.username === currentUser.username) {
            onUpdateCurrentUser({ username, password, role, name });
        }
      } else {
        // Create Mode
        if (users.some(u => u.username === username)) {
          setError('此帳號已存在');
          setLoading(false);
          return;
        }
        await api.saveUser({ username, password, role, name }, true);
      }

      await loadUsers();
      resetForm();
      alert(isEditing ? '使用者資料已更新' : '使用者已建立');
    } catch (e: any) {
      setError('儲存失敗: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (targetUsername === currentUser.username) {
      alert('無法刪除自己的帳號');
      return;
    }
    if (window.confirm(`確定要刪除帳號 ${targetUsername} 嗎？`)) {
      setLoading(true);
      try {
        await api.deleteUser(targetUsername);
        await loadUsers();
      } catch (e) {
        alert('刪除失敗');
      } finally {
        setLoading(false);
      }
    }
  };

  const startEdit = (user: User) => {
    setIsEditing(true);
    setEditingUser(user);
    setUsername(user.username);
    setPassword(user.password || ''); 
    setName(user.name || '');
    setRole(user.role);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 bg-slate-700 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">使用者管理</h2>
            <p className="text-slate-300 text-sm mt-1">管理系統帳號與權限 (系統管理員專用)</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* List Section */}
          <div className="w-full md:w-1/2 border-r border-gray-200 overflow-y-auto p-4 bg-gray-50">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center justify-between">
              現有使用者列表
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{users.length}</span>
            </h3>
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.username} className={`p-4 rounded-xl border transition-all ${editingUser?.username === user.username ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{user.name}</span>
                        <span className="text-xs text-gray-400">({user.username})</span>
                      </div>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {user.role === UserRole.ADMIN ? '系統管理員' : '物業管理員'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEdit(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編輯"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      {user.username !== currentUser.username && (
                        <button 
                          onClick={() => handleDeleteUser(user.username)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="刪除"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Section */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">
              {isEditing ? '編輯使用者' : '新增使用者'}
            </h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (中文)</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例如：陳大明"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳號 (英文)</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${isEditing ? 'bg-gray-100 text-gray-500' : ''}`}
                  placeholder="例如：manager01"
                  required
                  readOnly={isEditing}
                />
                <p className="text-xs text-gray-500 mt-1">{isEditing ? '帳號無法修改' : '請使用英數字組合'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                <input 
                  type="text" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="設定密碼"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">權限角色</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${role === UserRole.MANAGER ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value={UserRole.MANAGER} 
                      checked={role === UserRole.MANAGER}
                      onChange={() => setRole(UserRole.MANAGER)}
                      className="text-emerald-600 focus:ring-emerald-500 mr-3"
                    />
                    <div>
                      <span className="block font-medium text-gray-900">物業管理員</span>
                      <span className="block text-xs text-gray-500">權限：上傳帳單、刪除帳單</span>
                    </div>
                  </label>
                  
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${role === UserRole.ADMIN ? 'bg-purple-50 border-purple-500' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value={UserRole.ADMIN} 
                      checked={role === UserRole.ADMIN}
                      onChange={() => setRole(UserRole.ADMIN)}
                      className="text-purple-600 focus:ring-purple-500 mr-3"
                    />
                    <div>
                      <span className="block font-medium text-gray-900">系統管理員</span>
                      <span className="block text-xs text-gray-500">權限：所有功能 + 使用者帳號管理</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t mt-4">
                {isEditing && (
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    取消編輯
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={loading}
                  className={`flex-1 text-white font-bold py-3 rounded-xl shadow-lg shadow-gray-300 transition-colors ${loading ? 'bg-gray-400' : 'bg-slate-800 hover:bg-slate-900'}`}
                >
                  {loading ? '處理中...' : (isEditing ? '儲存變更' : '建立帳號')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};