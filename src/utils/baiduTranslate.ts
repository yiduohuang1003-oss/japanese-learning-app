// 百度翻译API集成 - 调试版本
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

// 调用百度翻译API
export async function translateWithBaidu(
  text: string, 
  from: string = 'zh', 
  to: string = 'jp'
): Promise<string> {
  console.log('🔄 开始调用百度翻译API');
  console.log('📝 翻译文本:', text);
  console.log('🌐 翻译方向:', `${from} -> ${to}`);
  
  // 检查Supabase配置
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('🔧 Supabase配置检查:');
  console.log('  - URL存在:', !!supabaseUrl);
  console.log('  - URL值:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : '未设置');
  console.log('  - Key存在:', !!supabaseKey);
  console.log('  - Key值:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : '未设置');
  
  if (!supabaseUrl || !supabaseKey) {
    const error = 'Supabase配置缺失，无法调用翻译服务';
    console.error('❌', error);
    throw new Error(error);
  }
  
  const apiUrl = `${supabaseUrl}/functions/v1/translate`;
  console.log('🎯 API地址:', apiUrl);
  
  const headers = {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };
  
  const requestBody = {
    text,
    from,
    to
  };
  
  console.log('📤 请求头:', {
    'Authorization': `Bearer ${supabaseKey.substring(0, 20)}...`,
    'Content-Type': 'application/json'
  });
  console.log('📤 请求体:', requestBody);
  
  try {
    console.log('🚀 发送请求...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log('📥 响应状态:', response.status);
    console.log('📥 响应状态文本:', response.statusText);
    console.log('📥 响应头:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('❌ HTTP错误:', response.status, response.statusText);
      
      // 尝试读取错误响应体
      try {
        const errorText = await response.text();
        console.error('❌ 错误响应体:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      } catch (readError) {
        console.error('❌ 无法读取错误响应:', readError);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log('✅ 响应数据:', data);
    
    if (data.error) {
      console.error('❌ API返回错误:', data.error);
      throw new Error(data.error);
    }
    
    if (data.success && data.result) {
      console.log('🎉 翻译成功:', data.result);
      return data.result;
    }
    
    throw new Error('翻译结果格式异常');
    
  } catch (error) {
    console.error('❌ 翻译请求失败:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接');
    }
    
    throw error;
  }
}

// 智能翻译：本地词典优先，百度API兜底
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
    
    console.log('🌐 本地词典未找到，尝试API翻译');
    try {
      const apiResult = await translateWithBaidu(text, 'jp', 'zh');
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
    
    console.log('🌐 本地词典未找到，尝试API翻译');
    try {
      const apiResult = await translateWithBaidu(text, 'zh', 'jp');
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
