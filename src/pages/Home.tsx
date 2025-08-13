import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { WordCategory } from '../types';
import { translateJapanese, isJapanese } from '../utils/dictionary';

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

export function Home() {
  const [input, setInput] = useState('');
  const [translation, setTranslation] = useState('');
  const [category, setCategory] = useState<WordCategory>('other');
  const [isPhrase, setIsPhrase] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addWord } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 自动翻译日语单词
    const autoTranslation = isJapanese(input.trim()) 
      ? translateJapanese(input.trim()).chinese
      : '待翻译';
    addWord({
      japanese: input.trim(),
      chinese: translation.trim() || autoTranslation,
      category,
      rating: 0,
      isPhrase,
    });

    // Show success animation
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Clear form
    setInput('');
    setTranslation('');
    setCategory('other');
    setIsPhrase(false);
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            日语单词学习助手
          </h1>
          <p className="text-lg text-gray-600">
            输入日语单词或句子，开始你的学习之旅
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Input */}
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入日语单词或句子..."
              className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Translation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                中文翻译（可选）
              </label>
              <input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="输入中文翻译..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WordCategory)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Word Type Toggle */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPhrase}
                onChange={(e) => setIsPhrase(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                这是一个句子（而非单词）
              </span>
            </label>
          </div>
        </form>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-300 rounded-full"></div>
              <span>单词已成功添加到单词库！</span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="text-center text-sm text-gray-500">
          按 Enter 键快速添加，或点击发送按钮
        </div>
      </div>
    </div>
  );
}
