import React, { useState } from 'react';
import { ImageCollection } from '../components/ImageCollection';
import { LinkCollection } from '../components/LinkCollection';
import { Images, Link } from 'lucide-react';

export function Collection() {
  const [activeTab, setActiveTab] = useState<'images' | 'links'>('images');

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">收纳箱</h1>
        <p className="text-gray-600 mt-1">管理你的学习素材</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('images')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'images'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Images className="w-5 h-5" />
                <span>图片收纳</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'links'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Link className="w-5 h-5" />
                <span>链接收纳</span>
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'images' ? <ImageCollection /> : <LinkCollection />}
      </div>
    </div>
  );
}
