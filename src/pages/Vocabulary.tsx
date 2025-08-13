import React, { useState, useMemo } from 'react';
import { 
  Star, 
  Volume2, 
  Filter, 
  Search,
  Trash2,
  Calendar,
  Tag
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Word, WordCategory, SortBy, SortOrder } from '../types';
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

export function Vocabulary() {
  const { words, updateWord, deleteWord } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'word' | 'phrase'>('all');
  const [filterRating, setFilterRating] = useState<number[]>([]);
  const [filterCategory, setFilterCategory] = useState<WordCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSortedWords = useMemo(() => {
    let filtered = words.filter(word => {
      const matchesSearch = word.japanese.includes(searchTerm) || 
                           word.chinese.includes(searchTerm);
      const matchesType = filterType === 'all' || 
                         (filterType === 'word' && !word.isPhrase) ||
                         (filterType === 'phrase' && word.isPhrase);
      const matchesRating = filterRating.length === 0 || 
                           filterRating.includes(word.rating);
      const matchesCategory = filterCategory === 'all' || 
                             word.category === filterCategory;
      
      return matchesSearch && matchesType && matchesRating && matchesCategory;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [words, searchTerm, filterType, filterRating, filterCategory, sortBy, sortOrder]);

  const handleRatingChange = (wordId: string, rating: number) => {
    updateWord(wordId, { rating });
  };

  const handleCategoryChange = (wordId: string, category: WordCategory) => {
    updateWord(wordId, { category });
  };

  const playPronunciation = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8; // 稍微慢一点，更清晰
    utterance.pitch = 1.0; // 自然音调
    
    // 尝试使用更自然的日语语音
    const voices = speechSynthesis.getVoices();
    const japaneseVoices = voices.filter(voice => 
      voice.lang.includes('ja') || voice.lang.includes('JP')
    );
    
    // 优先选择女性日语语音，通常更清晰
    const preferredVoice = japaneseVoices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('女性') ||
      voice.name.includes('Kyoko') ||
      voice.name.includes('Otoya')
    ) || japaneseVoices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    speechSynthesis.speak(utterance);
  };

  const toggleRatingFilter = (rating: number) => {
    setFilterRating(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">单词库</h1>
          <div className="text-sm text-gray-500">
            共 {words.length} 个单词/句子
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="border-b border-gray-200 px-6 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索单词或翻译..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'word' | 'phrase')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部类型</option>
            <option value="word">单词</option>
            <option value="phrase">句子</option>
          </select>

          {/* Category Filter */}
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

          {/* Rating Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">星级:</span>
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => toggleRatingFilter(rating)}
                className={`p-1 rounded ${
                  filterRating.includes(rating)
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split('-');
              setSortBy(by as SortBy);
              setSortOrder(order as SortOrder);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt-desc">最新添加</option>
            <option value="createdAt-asc">最早添加</option>
            <option value="rating-desc">星级高到低</option>
            <option value="rating-asc">星级低到高</option>
          </select>
        </div>
      </div>

      {/* Word List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAndSortedWords.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-lg">暂无匹配的单词</p>
            <p className="text-sm mt-2">试试调整筛选条件或添加新单词</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedWords.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                onRatingChange={handleRatingChange}
                onCategoryChange={handleCategoryChange}
                onDelete={() => deleteWord(word.id)}
                onPlayPronunciation={playPronunciation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface WordCardProps {
  word: Word;
  onRatingChange: (wordId: string, rating: number) => void;
  onCategoryChange: (wordId: string, category: WordCategory) => void;
  onDelete: () => void;
  onPlayPronunciation: (text: string) => void;
}

function WordCard({ 
  word, 
  onRatingChange, 
  onCategoryChange, 
  onDelete, 
  onPlayPronunciation 
}: WordCardProps) {
  const { updateWord } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState(word.chinese);

  const handleSaveTranslation = () => {
    updateWord(word.id, { chinese: editedTranslation });
    setIsEditing(false);
  };

  const handleAutoTranslate = () => {
    if (isJapanese(word.japanese)) {
      const translation = translateJapanese(word.japanese);
      setEditedTranslation(translation.chinese);
      updateWord(word.id, { chinese: translation.chinese });
    }
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Japanese Text */}
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{word.japanese}</h3>
            {(() => {
              const translation = translateJapanese(word.japanese);
              return translation.furigana && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {translation.furigana}
                </span>
              );
            })()}
            <button
              onClick={() => onPlayPronunciation(word.japanese)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <span className={`px-2 py-1 text-xs rounded-full ${
              word.isPhrase 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {word.isPhrase ? '句子' : '单词'}
            </span>
          </div>

          {/* Chinese Translation */}
          <div className="mb-4">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editedTranslation}
                  onChange={(e) => setEditedTranslation(e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAutoTranslate}
                  className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  title="自动翻译"
                >
                  译
                </button>
                <button
                  onClick={handleSaveTranslation}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            ) : (
              <p 
                className="text-gray-600 cursor-pointer hover:text-blue-600"
                onClick={() => setIsEditing(true)}
              >
                {word.chinese}
              </p>
            )}
          </div>

          {/* Category and Rating */}
          <div className="flex items-center space-x-4 mb-4">
            <select
              value={word.category}
              onChange={(e) => onCategoryChange(word.id, e.target.value as WordCategory)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => onRatingChange(word.id, rating)}
                  className={`p-1 ${
                    rating <= word.rating
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center text-xs text-gray-400">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(word.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
