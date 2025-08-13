// 百度翻译API集成 - 使用替代方案
interface TranslationResult {
  japanese: string;
  chinese: string;
  source: 'local' | 'api';
  furigana?: string;
}

// 临时使用本地词典进行反向查找
function findJapaneseByChineseInDict(chinese: string): string | null {
  const { japaneseDict } = require('./dictionary');
  
  // 在词典中查找中文对应的日语
  for (const [japanese, entry] of Object.entries(japaneseDict)) {
    const chineseTranslation = typeof entry === 'string' ? entry : entry.chinese;
    if (chineseTranslation === chinese) {
      return japanese;
    }
  }
  
  return null;
}

// 使用多个免费翻译API服务
export async function translateWithFreeAPI(
  text: string, 
  from: string = 'zh', 
  to: string = 'ja'
): Promise<string> {
  console.log('🔄 开始调用免费翻译API');
  console.log('📝 翻译文本:', text);
  console.log('🌐 翻译方向:', `${from} -> ${to}`);
  
  // API列表，按优先级排序
  const apis = [
    {
      name: 'LibreTranslate',
      url: 'https://libretranslate.de/translate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: from === 'zh' ? 'zh' : 'ja',
        target: to === 'ja' ? 'ja' : 'zh',
        format: 'text'
      }),
      parseResponse: (data: any) => data.translatedText
    },
    {
      name: 'MyMemory',
      url: `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
      method: 'GET',
      headers: {},
      body: null,
      parseResponse: (data: any) => data.responseData?.translatedText
    }
  ];

  // 尝试每个API
  for (const api of apis) {
    try {
      console.log(`🎯 尝试 ${api.name} API:`, api.url);
      
      const response = await fetch(api.url, {
        method: api.method,
        headers: api.headers,
        body: api.body
      });
      
      console.log(`📥 ${api.name} 响应状态:`, response.status);
      
      if (!response.ok) {
        console.warn(`❌ ${api.name} HTTP错误:`, response.status, response.statusText);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ ${api.name} 响应数据:`, data);
      
      const result = api.parseResponse(data);
      if (result && result.trim()) {
        console.log(`🎉 ${api.name} 翻译成功:`, result);
        return result.trim();
      }
      
      console.warn(`⚠️ ${api.name} 返回空结果`);
      
    } catch (error) {
      console.error(`❌ ${api.name} 请求失败:`, error);
      continue;
    }
  }
  
  throw new Error('所有翻译API都失败了');
}

// 智能翻译：本地词典优先，免费API兜底
export async function smartTranslate(
  text: string, 
  direction: 'zh-to-jp' | 'jp-to-zh' = 'zh-to-jp'
): Promise<TranslationResult> {
  console.log('🧠 智能翻译开始');
  console.log('📝 输入文本:', text);
  console.log('🔄 翻译方向:', direction);
  
  const { translateJapanese, isJapanese, japaneseDict } = await import('./dictionary');
  
  if (direction === 'jp-to-zh') {
    console.log('🔍 日语到中文翻译');
    // 日语到中文：优先使用本地词典
    const localResult = translateJapanese(text);
    
    if (localResult.chinese !== '待翻译') {
      console.log('✅ 本地词典找到翻译:', localResult);
      return {
        japanese: text,
        chinese: localResult.chinese,
        furigana: localResult.furigana,
        source: 'local'
      };
    }
    
    console.log('🌐 本地词典未找到，尝试免费API翻译');
    try {
      const apiResult = await translateWithFreeAPI(text, 'ja', 'zh');
      console.log('✅ API翻译成功:', apiResult);
      return {
        japanese: text,
        chinese: apiResult,
        source: 'api'
      };
    } catch (error) {
      console.error('❌ API翻译失败:', error);
      return {
        japanese: text,
        chinese: `翻译失败: ${error.message}`,
        source: 'api'
      };
    }
  } else {
    console.log('🔍 中文到日语翻译');
    
    // 中文到日语：先尝试本地词典反查
    console.log('🔍 在本地词典中反查...');
    for (const [japanese, entry] of Object.entries(japaneseDict)) {
      const chineseTranslation = typeof entry === 'string' ? entry : entry.chinese;
      if (chineseTranslation === text.trim()) {
        console.log('✅ 本地词典反查找到:', japanese);
        const localResult = translateJapanese(japanese);
        return {
          japanese: japanese,
          chinese: text,
          furigana: localResult.furigana,
          source: 'local'
        };
      }
    }
    
    console.log('🌐 本地词典未找到，尝试免费API翻译');
    try {
      const apiResult = await translateWithFreeAPI(text, 'zh', 'ja');
      console.log('✅ API翻译成功:', apiResult);
      return {
        japanese: apiResult,
        chinese: text,
        source: 'api'
      };
    } catch (error) {
      console.error('❌ API翻译失败:', error);
      
      // 如果API失败，尝试简单的音译或提供建议
      const suggestions = getSuggestions(text);
      return {
        japanese: suggestions.length > 0 ? suggestions[0] : '翻译暂不可用',
        chinese: text,
        source: 'api'
      };
    }
  }
}

// 获取翻译建议（基于常见模式）
function getSuggestions(chinese: string): string[] {
  const suggestions: string[] = [];
  
  // 简单的音译规则
  const phoneticMap: Record<string, string> = {
    '你好': 'こんにちは',
    '谢谢': 'ありがとう',
    '对不起': 'すみません',
    '再见': 'さようなら',
    '早上好': 'おはよう',
    '晚上好': 'こんばんは',
    '是': 'はい',
    '不是': 'いいえ',
    '水': 'みず',
    '茶': 'おちゃ',
    '咖啡': 'コーヒー',
    '米饭': 'ごはん',
    '面包': 'パン',
    '肉': 'にく',
    '鱼': 'さかな',
    '蔬菜': 'やさい',
    '水果': 'くだもの',
    '苹果': 'りんご',
    '香蕉': 'バナナ',
    '家': 'いえ',
    '学校': 'がっこう',
    '工作': 'しごと',
    '朋友': 'ともだち',
    '老师': 'せんせい',
    '学生': 'がくせい',
    '今天': 'きょう',
    '明天': 'あした',
    '昨天': 'きのう',
    '现在': 'いま',
    '时间': 'じかん',
    '钱': 'おかね',
    '书': 'ほん',
    '电话': 'でんわ',
    '电脑': 'パソコン',
    '汽车': 'くるま',
    '电车': 'でんしゃ',
    '飞机': 'ひこうき',
    '医院': 'びょういん',
    '银行': 'ぎんこう',
    '商店': 'みせ',
    '餐厅': 'レストラン',
    '酒店': 'ホテル'
  };
  
  // 检查是否有直接匹配
  if (phoneticMap[chinese]) {
    suggestions.push(phoneticMap[chinese]);
  }
  
  // 检查是否包含已知词汇
  for (const [cn, jp] of Object.entries(phoneticMap)) {
    if (chinese.includes(cn)) {
      suggestions.push(jp);
    }
  }
  
  return suggestions;
}
