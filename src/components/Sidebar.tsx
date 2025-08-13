import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Book, 
  Archive, 
  Settings,
  BookOpen,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

const menuItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/vocabulary', label: '单词库', icon: Book },
  { path: '/collection', label: '收纳箱', icon: Archive },
  { path: '/settings', label: '设置', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">日语学习</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {isSupabaseConfigured && user && (
          <>
            <div className="mb-3 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </>
        )}
        {!isSupabaseConfigured && (
          <div className="mb-3 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>离线模式</span>
            </div>
          </div>
        )}
        <div className="text-xs text-gray-500 text-center">
          日语单词学习助手 v1.0
        </div>
      </div>
    </div>
  );
}
