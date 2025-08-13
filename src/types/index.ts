export interface Word {
  id: string;
  japanese: string;
  chinese: string;
  category: WordCategory;
  rating: number; // 1-5 stars
  createdAt: Date;
  isPhrase: boolean; // true for sentences, false for single words
}

export interface ImageItem {
  id: string;
  url: string;
  name: string;
  createdAt: Date;
  isArchived: boolean;
  extractedWords?: string[];
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  category: WordCategory;
  isProcessed: boolean;
  createdAt: Date;
}

export type WordCategory = 
  | 'clothing' // 衣
  | 'food' // 食
  | 'housing' // 住
  | 'transport' // 行
  | 'shopping' // 购物
  | 'people' // 人物
  | 'conversation' // 对话
  | 'other';

export type SortBy = 'createdAt' | 'rating';
export type SortOrder = 'asc' | 'desc';
