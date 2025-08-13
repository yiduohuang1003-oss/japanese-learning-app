import React from 'react';
import { 
  User, 
  Database, 
  Download, 
  Upload, 
  Trash2,
  Info
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export function Settings() {
  const { words, images, links } = useApp();
  const { user } = useAuth();

  const exportData = () => {
    const data = {
      words,
      images,
      links,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `japanese-vocabulary-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        console.log('Import data:', data);
        alert('数据导入功能正在开发中，敬请期待！');
      } catch (error) {
        alert('文件格式错误，请选择有效的备份文件');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可撤销！')) {
      if (window.confirm('请再次确认：这将删除所有单词、图片和链接数据')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-600 mt-1">管理你的学习数据和应用配置</p>
        </div>

        {/* Data Statistics */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            数据统计
          </h2>
          {user && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>当前用户：</strong> {user?.email}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{words.length}</div>
              <div className="text-sm text-gray-600">单词/句子</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{images.length}</div>
              <div className="text-sm text-gray-600">图片</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{links.length}</div>
              <div className="text-sm text-gray-600">链接</div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数据管理</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">导出数据</h3>
                  <p className="text-sm text-gray-600">将所有学习数据导出为JSON文件</p>
                </div>
              </div>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                导出
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Upload className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">导入数据</h3>
                  <p className="text-sm text-gray-600">从JSON文件恢复学习数据</p>
                </div>
              </div>
              <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                选择文件
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-gray-900">清除所有数据</h3>
                  <p className="text-sm text-red-600">⚠️ 此操作将删除所有数据且不可撤销</p>
                </div>
              </div>
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                清除
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            关于应用
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>版本:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>数据存储:</span>
              <span>本地浏览器存储</span>
            </div>
            <div className="flex justify-between">
              <span>支持的功能:</span>
              <span>单词管理、图片收纳、链接收纳</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">使用提示</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 数据保存在本地浏览器中，清除浏览器数据会丢失所有内容</li>
              <li>• 建议定期导出数据进行备份</li>
              <li>• 图片文件会转换为Base64格式存储，大量图片可能影响性能</li>
              <li>• 发音功能需要浏览器支持Web Speech API</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
