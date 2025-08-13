// 高频日语词汇词典
export interface DictionaryEntry {
  chinese: string;
  furigana?: string; // 假名读音
}

export const japaneseDict: Record<string, DictionaryEntry | string> = {
  // 基础词汇
  'こんにちは': { chinese: '你好' },
  'ありがとう': { chinese: '谢谢' },
  'すみません': { chinese: '对不起' },
  'はい': { chinese: '是' },
  'いいえ': { chinese: '不是' },
  'おはよう': { chinese: '早上好' },
  'こんばんは': { chinese: '晚上好' },
  'さようなら': { chinese: '再见' },
  
  // 数字
  'いち': { chinese: '一' },
  '一': { chinese: '一', furigana: 'いち' },
  'に': { chinese: '二' },
  '二': { chinese: '二', furigana: 'に' },
  'さん': { chinese: '三' },
  '三': { chinese: '三', furigana: 'さん' },
  
  // 时间
  'いま': { chinese: '现在' },
  '今': { chinese: '现在', furigana: 'いま' },
  'きょう': { chinese: '今天' },
  '今日': { chinese: '今天', furigana: 'きょう' },
  'あした': { chinese: '明天' },
  '明日': { chinese: '明天', furigana: 'あした' },
  
  // 食物
  'みず': { chinese: '水' },
  '水': { chinese: '水', furigana: 'みず' },
  'ごはん': { chinese: '米饭' },
  'ご飯': { chinese: '米饭', furigana: 'ごはん' },
  'パン': { chinese: '面包' },
  
  // 常用外来语
  'コーヒー': { chinese: '咖啡' },
  'ホテル': { chinese: '酒店' },
  'レストラン': { chinese: '餐厅' },
  'タクシー': { chinese: '出租车' },
  'バス': { chinese: '公交车' },
};

// 翻译函数
export function translateJapanese(japanese: string): { chinese: string; furigana?: string } {
  const cleanJapanese = japanese.trim();
  
  // 直接匹配
  if (japaneseDict[cleanJapanese]) {
    const entry = japaneseDict[cleanJapanese];
    return typeof entry === 'string' ? { chinese: entry } : entry;
  }
  
  // 如果没有找到翻译，返回默认值
  return { chinese: '待翻译' };
}

// 检查是否为日语文本
export function isJapanese(text: string): boolean {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}
