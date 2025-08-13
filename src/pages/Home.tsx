import React, { useState } from 'react';
import { Send, Sparkles, Languages, Copy, Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { WordCategory } from '../types';
import { translateJapanese, isJapanese } from '../utils/dictionary';
import { smartTranslate } from '../utils/baiduTranslate';

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
  const [mode, setMode] = useState<'japanese' | 'chinese'>('japanese');
  const [input, setInput] = useState('');
  const [chineseInput, setChineseInput] = useState('');
  const [translation, setTranslation] = useState('');
  const [category, setCategory] = useState<WordCategory>('other');
  const [isPhrase, setIsPhrase] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [translationResult, setTranslationResult] = useState<{
    japanese: string;
    chinese: string;
    furigana?: string;
    source: 'local' | 'api';
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const { addWord } = useApp();

  const handleJapaneseSubmit = (e: React.FormEvent) => {
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

  const handleChineseTranslate = async () => {
    if (!chineseInput.trim()) return;
    
    setIsTranslating(true);
    try {
      const result = await smartTranslate(chineseInput.trim(), 'zh-to-jp');
      setTranslationResult(result);
    } catch (error) {
      console.error('翻译失败:', error);
      setTranslationResult({
        japanese: '翻译失败',
        chinese: chineseInput.trim(),
        source: 'api'
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddTranslationToLibrary = () => {
    if (!translationResult) return;
    
    addWord({
      japanese: translationResult.japanese,
      chinese: translationResult.chinese,
      category,
      rating: 0,
      isPhrase: translationResult.japanese.length > 10,
    });

    // Show success animation
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    // Clear form
    setChineseInput('');
    setTranslationResult(null);
    setCategory('other');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
          
          {/* Mode Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => setMode('japanese')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                mode === 'japanese'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Languages className="w-5 h-5" />
              <span>日语输入</span>
            </button>
            <button
              onClick={() => setMode('chinese')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                mode === 'chinese'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Languages className="w-5 h-5" />
              <span>中文输入</span>
            </button>
          </div>
          
          <p className="text-lg text-gray-600">
            {mode === 'japanese' 
              ? '输入日语单词或句子，开始你的学习之旅'
              : '输入中文，获取日语翻译并添加到单词库'
            }
          </p>
        </div>

        {mode === 'japanese' ? (
          /* Japanese Input Form */
          <form onSubmit={handleJapaneseSubmit} className="space-y-6">
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
        ) : (
          /* Chinese Input Form */
          <div className="space-y-6">
            {/* Chinese Input */}
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={chineseInput}
                  onChange={(e) => setChineseInput(e.target.value)}
                  placeholder="请输入中文词汇或句子..."
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                  rows={3}
                />
                <button
                  onClick={handleChineseTranslate}
                  disabled={!chineseInput.trim() || isTranslating}
                  className="absolute right-3 bottom-3 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isTranslating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Languages className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={handleChineseTranslate}
                  disabled={!chineseInput.trim() || isTranslating}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isTranslating ? '翻译中...' : '获取日语翻译'}
                </button>
              </div>
            </div>

            {/* Translation Result */}
            {translationResult && (
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">翻译结果</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    translationResult.source === 'local' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {translationResult.source === 'local' ? '本地词典' : '百度翻译'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {/* Japanese Result */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">日语</div>
                      <div className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                        <span>{translationResult.japanese}</span>
                        {translationResult.furigana && (
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {translationResult.furigana}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(translationResult.japanese)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="复制日语"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Chinese Result */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">中文</div>
                      <div className="text-lg text-gray-900">{translationResult.chinese}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(translationResult.chinese)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="复制中文"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Add to Library Section */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      添加到单词库
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as WordCategory)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleAddTranslationToLibrary}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>添加到单词库</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="text-center text-sm text-gray-500">
          {mode === 'japanese' ? (
            '按 Enter 键快速添加，或点击发送按钮'
          ) : (
            '支持本地词典优先，百度翻译兜底的智能翻译'
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed top-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse z-50">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-300 rounded-full"></div>
              <span>单词已成功添加到单词库！</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
