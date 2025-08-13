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

// 使用免费的翻译API服务
export async function translateWithFreeAPI(
  text: string, 
  from: string = 'zh', 
  to: string = 'ja'
): Promise<string> {
  console.log('🔄 开始调用免费翻译API');
  console.log('📝 翻译文本:', text);
  console.log('🌐 翻译方向:', `${from} -> ${to}`);
  
  try {
    // 使用 MyMemory 翻译API（免费，无需密钥）
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    
    console.log('🎯 API地址:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    console.log('📥 响应状态:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ 响应数据:', data);
    
    if (data.responseData && data.responseData.translatedText) {
      console.log('🎉 翻译成功:', data.responseData.translatedText);
      return data.responseData.translatedText;
    }
    
    throw new Error('翻译结果格式异常');
    
  } catch (error) {
    console.error('❌ 翻译请求失败:', error);
    throw error;
  }
}

// 智能翻译：本地词典优先，免费API兜底
export async function smartTranslate(
  text: string, 
  direction: 'zh-to-jp' | 'jp-to-zh' = 'zh-to-jp'
): Promise<TranslationResult> {
  console.log('🧠 智能翻译开始');
  console.log('📝 输入文本:', text);
  console.log('🔄 翻译方向:', direction);
  
  const { translateJapanese, isJapanese } = await import('./dictionary');
  
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
    const japaneseFromDict = findJapaneseByChineseInDict(text);
    
    if (japaneseFromDict) {
      console.log('✅ 本地词典反查找到:', japaneseFromDict);
      const localResult = translateJapanese(japaneseFromDict);
      return {
        japanese: japaneseFromDict,
        chinese: text,
        furigana: localResult.furigana,
        source: 'local'
      };
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
      return {
        japanese: `翻译失败: ${error.message}`,
        chinese: text,
        source: 'api'
      };
    }
  }
}
