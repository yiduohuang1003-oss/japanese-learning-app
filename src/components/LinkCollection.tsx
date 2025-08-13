import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  Trash2, 
  ExternalLink,
  Filter,
  Calendar
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { LinkItem, WordCategory } from '../types';

const categories: { value: WordCategory; label: string }[] = [
  { value: 'clothing', label: '衣' },
  { value: 'food', label: '食' },
  { value: 'housing', label: '住' },
  { value: 'transport', label: '行' },
  { value: 'shopping', label: '购物' },
  { value: 'people', label: '人物' },
  { value: 'conversation', label: '对话' },
  { value: 'other', label: '其他' },
];

export function LinkCollection() {
  const { links, addLink, updateLink, deleteLink, deleteLinks } = useApp();
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({
    url: '',
    title: '',
    category: 'other' as WordCategory
  });
  const [filterProcessed, setFilterProcessed] = useState<'all' | 'processed' | 'unprocessed'>('all');
  const [filterCategory, setFilterCategory] = useState<WordCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredLinks = links
    .filter(link => {
      const matchesProcessed = filterProcessed === 'all' || 
        (filterProcessed === 'processed' && link.isProcessed) ||
        (filterProcessed === 'unprocessed' && !link.isProcessed);
      const matchesCategory = filterCategory === 'all' || link.category === filterCategory;
      return matchesProcessed && matchesCategory;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
    });

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLink.url.trim()) {
      addLink({
        url: newLink.url.trim(),
        title: newLink.title.trim() || extractTitleFromUrl(newLink.url),
        category: newLink.category,
        isProcessed: false
      });
      
      setNewLink({ url: '', title: '', category: 'other' });
      setShowAddForm(false);
    }
  };

  const extractTitleFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const toggleProcessed = (linkId: string) => {
    const link = links.find(l => l.id === linkId);
    if (link) {
      updateLink(linkId, { isProcessed: !link.isProcessed });
    }
  };

  const toggleLinkSelection = (linkId: string) => {
    setSelectedLinks(prev => 
      prev.includes(linkId) 
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId]
    );
  };

  const handleBatchDelete = () => {
    if (selectedLinks.length > 0) {
      deleteLinks(selectedLinks);
      setSelectedLinks([]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="border-b border-gray-200 px-6 py-4 space-y-4">
        {/* Add Link and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>添加链接</span>
            </button>

            {selectedLinks.length > 0 && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>删除选中 ({selectedLinks.length})</span>
              </button>
            )}
          </div>

          <div className="text-sm text-gray-500">
            共 {links.length} 个链接
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <form onSubmit={handleAddLink} className="space-y-3">
              <div>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="请输入链接地址..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="标题（可选）"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newLink.category}
                  onChange={(e) => setNewLink(prev => ({ ...prev, category: e.target.value as WordCategory }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  添加
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <select
            value={filterProcessed}
            onChange={(e) => setFilterProcessed(e.target.value as 'all' | 'processed' | 'unprocessed')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部链接</option>
            <option value="unprocessed">未整理</option>
            <option value="processed">已整理</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as WordCategory | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部分类</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">最新添加</option>
            <option value="asc">最早添加</option>
          </select>
        </div>
      </div>

      {/* Links List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredLinks.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <div className="text-6xl mb-4">🔗</div>
            <p className="text-lg">暂无链接</p>
            <p className="text-sm mt-2">点击添加按钮开始收集链接</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLinks.map((link) => (
              <div key={link.id} className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                selectedLinks.includes(link.id) ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
              }`}>
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => toggleLinkSelection(link.id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${
                      selectedLinks.includes(link.id)
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {selectedLinks.includes(link.id) && <Check className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{link.title}</h3>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 truncate block mt-1 flex items-center"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="w-4 h-4 ml-1 flex-shrink-0" />
                        </a>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => toggleProcessed(link.id)}
                          className={`p-1 rounded transition-colors ${
                            link.isProcessed 
                              ? 'text-green-600 hover:text-green-700' 
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={link.isProcessed ? '已整理' : '未整理'}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <select
                        value={link.category}
                        onChange={(e) => updateLink(link.id, { category: e.target.value as WordCategory })}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>

                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(link.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
