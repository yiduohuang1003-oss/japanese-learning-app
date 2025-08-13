import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Archive, 
  Trash2, 
  Check,
  Filter,
  Calendar,
  Plus,
  X,
  Clipboard,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { translateJapanese, isJapanese } from '../utils/dictionary';

export function ImageCollection() {
  const { images, addImage, updateImage, deleteImage, deleteImages, addWord } = useApp();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [filterArchived, setFilterArchived] = useState<'all' | 'archived' | 'unarchived'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [extractingWords, setExtractingWords] = useState<string | null>(null);
  const [wordInput, setWordInput] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 添加全局粘贴事件监听
  React.useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 只在图片收纳页面且没有其他输入框聚焦时处理
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                addImage({
                  url: event.target.result as string,
                  name: `粘贴图片_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`,
                  isArchived: false,
                  extractedWords: []
                });
              }
            };
            reader.readAsDataURL(file);
          }
          e.preventDefault();
          break;
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [addImage]);

  const filteredImages = images
    .filter(img => {
      if (filterArchived === 'archived') return img.isArchived;
      if (filterArchived === 'unarchived') return !img.isArchived;
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
    });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addImage({
            url: event.target.result as string,
            name: file.name,
            isArchived: false,
            extractedWords: []
          });
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              addImage({
                url: event.target.result as string,
                name: `粘贴图片_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`,
                isArchived: false,
                extractedWords: []
              });
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
    setShowPasteArea(false);
  };

  const handlePasteAreaClick = () => {
    setShowPasteArea(true);
  };
  const handleArchive = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      updateImage(imageId, { isArchived: !image.isArchived });
    }
  };

  const handleBatchDelete = () => {
    if (selectedImages.length > 0) {
      deleteImages(selectedImages);
      setSelectedImages([]);
    }
  };

  const handleExtractWords = (imageId: string) => {
    setExtractingWords(imageId);
    setWordInput('');
  };

  const handleSaveWords = (imageId: string) => {
    if (wordInput.trim()) {
      const words = wordInput.split('\n').filter(w => w.trim());
      
      // Add words to vocabulary
      words.forEach(word => {
        const trimmedWord = word.trim();
        if (trimmedWord) {
          // 自动翻译日语单词
          const autoTranslation = isJapanese(trimmedWord) 
            ? translateJapanese(trimmedWord).chinese
            : '待翻译';
            
          addWord({
            japanese: trimmedWord,
            chinese: autoTranslation,
            category: 'other',
            rating: 0,
            isPhrase: trimmedWord.length > 10 // Simple heuristic
          });
        }
      });

      // Update image with extracted words
      updateImage(imageId, { 
        extractedWords: words.map(w => w.trim()).filter(w => w)
      });
    }
    
    setExtractingWords(null);
    setWordInput('');
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="border-b border-gray-200 px-6 py-4 space-y-4">
        {/* Upload and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>上传图片</span>
            </button>
            
            <button
              onClick={handlePasteAreaClick}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Clipboard className="w-5 h-5" />
              <span>粘贴图片</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {selectedImages.length > 0 && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>删除选中 ({selectedImages.length})</span>
              </button>
            )}
          </div>

          <div className="text-sm text-gray-500">
            共 {images.length} 张图片
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <select
            value={filterArchived}
            onChange={(e) => setFilterArchived(e.target.value as 'all' | 'archived' | 'unarchived')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部图片</option>
            <option value="unarchived">未存档</option>
            <option value="archived">已存档</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">最新上传</option>
            <option value="asc">最早上传</option>
          </select>
        </div>
      </div>

      {/* Paste Area Modal */}
      {showPasteArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <Clipboard className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">粘贴图片</h3>
              <p className="text-gray-600 mb-6">
                请使用 Ctrl+V (Windows) 或 Cmd+V (Mac) 粘贴图片
              </p>
              <div 
                className="border-2 border-dashed border-green-300 rounded-lg p-8 mb-4 bg-green-50"
                onPaste={handlePaste}
                tabIndex={0}
                autoFocus
              >
                <p className="text-green-700">点击这里并按 Ctrl+V 粘贴</p>
              </div>
              <button
                onClick={() => setShowPasteArea(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Area Modal */}
      {showPasteArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <Clipboard className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">粘贴图片</h3>
              <p className="text-gray-600 mb-6">
                请使用 Ctrl+V (Windows) 或 Cmd+V (Mac) 粘贴图片
              </p>
              <div 
                className="border-2 border-dashed border-green-300 rounded-lg p-8 mb-4 bg-green-50"
                onPaste={handlePaste}
                tabIndex={0}
                autoFocus
              >
                <p className="text-green-700">点击这里并按 Ctrl+V 粘贴</p>
              </div>
              <button
                onClick={() => setShowPasteArea(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredImages.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-lg">暂无图片</p>
            <p className="text-sm mt-2">点击上传按钮添加图片</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isSelected={selectedImages.includes(image.id)}
                onToggleSelection={() => toggleImageSelection(image.id)}
                onArchive={() => handleArchive(image.id)}
                onDelete={() => deleteImage(image.id)}
                onExtractWords={() => handleExtractWords(image.id)}
                isExtracting={extractingWords === image.id}
                wordInput={extractingWords === image.id ? wordInput : ''}
                onWordInputChange={setWordInput}
                onSaveWords={() => handleSaveWords(image.id)}
                onCancelExtract={() => setExtractingWords(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ImageCardProps {
  image: any;
  isSelected: boolean;
  onToggleSelection: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onExtractWords: () => void;
  isExtracting: boolean;
  wordInput: string;
  onWordInputChange: (value: string) => void;
  onSaveWords: () => void;
  onCancelExtract: () => void;
}

function ImageCard({
  image,
  isSelected,
  onToggleSelection,
  onArchive,
  onDelete,
  onExtractWords,
  isExtracting,
  wordInput,
  onWordInputChange,
  onSaveWords,
  onCancelExtract,
}: ImageCardProps) {
  return (
    <div className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
    }`}>
      {/* Image */}
      <div className="relative">
        <img 
          src={image.url} 
          alt={image.name}
          className="w-full h-80 object-contain bg-gray-50"
        />
        
        {/* Selection Overlay */}
        <div className="absolute top-2 left-2">
          <button
            onClick={onToggleSelection}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isSelected 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'bg-white border-gray-300 hover:border-blue-500'
            }`}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </button>
        </div>

        {/* Archive Status */}
        {image.isArchived && (
          <div className="absolute top-2 right-2">
            <div className="bg-green-600 text-white p-1 rounded-full">
              <Check className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-2">{image.name}</h3>
        
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(image.createdAt).toLocaleDateString('zh-CN')}
        </div>

        {/* Extracted Words */}
        {image.extractedWords && image.extractedWords.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">已提取单词:</div>
            <div className="flex flex-wrap gap-1">
              {image.extractedWords.slice(0, 3).map((word: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {word}
                </span>
              ))}
              {image.extractedWords.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{image.extractedWords.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Word Extraction Interface */}
        {isExtracting && (
          <div className="mb-3 space-y-2">
            <textarea
              value={wordInput}
              onChange={(e) => onWordInputChange(e.target.value)}
              placeholder="请输入从图片中提取的单词，每行一个..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={onCancelExtract}
                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                取消
              </button>
              <button
                onClick={onSaveWords}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                保存到单词库
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExtractWords}
            disabled={isExtracting}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>提取单词</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onArchive}
              className={`p-1 rounded transition-colors ${
                image.isArchived 
                  ? 'text-green-600 hover:text-green-700' 
                  : 'text-gray-400 hover:text-green-600'
              }`}
            >
              <Archive className="w-4 h-4" />
            </button>
            
            <button
              onClick={onDelete}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
