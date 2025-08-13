// 百度翻译API集成 - 通过Supabase Edge Function
interface BaiduTranslateResponse {
  from: string;
  to: string;
  trans_result: Array<{
    src: string;
    dst: string;
  }>;
  error_code?: string;
  error_msg?: string;
}

interface TranslationResult {
  japanese: string;
  chinese: string;
  source: 'local' | 'api';
  furigana?: string;
}

interface EdgeFunctionResponse {
  success?: boolean;
  result?: string;
  error?: string;
  details?: string;
  code?: string;
}

// 通过Supabase Edge Function调用百度翻译API
export async function translateWithBaidu(
  text: string, 
  from: string = 'zh', 
  to: string = 'jp'
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('Supabase配置缺失，无法使用翻译功能');
  }
  
  const functionUrl = `${supabaseUrl}/functions/v1/translate`;
  
  console.log('调用翻译Edge Function:', {
    url: functionUrl,
    text,
    from,
    to
  });

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        text,
        from,
        to
      })
    });
    
    console.log('Edge Function响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function错误响应:', errorText);
      throw new Error(`翻译服务错误: ${response.status} ${response.statusText}`);
    }
    
    const data: EdgeFunctionResponse = await response.json();
    
    console.log('Edge Function响应数据:', data);
    
    if (data.error) {
      throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
    }
    
    if (data.success && data.result) {
      return data.result;
    }
    
    throw new Error('翻译结果为空');
  } catch (error) {
    console.error('调用翻译Edge Function失败:', error);
    throw error;
  }
}

// 智能翻译：本地词典优先，API兜底
export async function smartTranslate(
  text: string, 
  direction: 'zh-to-jp' | 'jp-to-zh' = 'zh-to-jp'
): Promise<TranslationResult> {
  const { translateJapanese, isJapanese } = await import('./dictionary');
  
  if (direction === 'jp-to-zh') {
    // 日语到中文：优先使用本地词典
    const localResult = translateJapanese(text);
    
    if (localResult.chinese !== '待翻译') {
      return {
        japanese: text,
        chinese: localResult.chinese,
        furigana: localResult.furigana,
        source: 'local'
      };
    }
    
    // 本地词典没有，使用百度API
    try {
      const apiResult = await translateWithBaidu(text, 'jp', 'zh');
      return {
        japanese: text,
        chinese: apiResult,
        source: 'api'
      };
    } catch (error) {
      console.error('百度翻译失败:', error);
      return {
        japanese: text,
        chinese: '翻译失败',
        source: 'api'
      };
    }
  } else {
    // 中文到日语：直接使用百度API
    try {
      const apiResult = await translateWithBaidu(text, 'zh', 'jp');
      
      // 尝试从本地词典获取假名
      const localResult = translateJapanese(apiResult);
      
      return {
        japanese: apiResult,
        chinese: text,
        furigana: localResult.furigana,
        source: 'api'
      };
    } catch (error) {
      console.error('百度翻译失败:', error);
      return {
        japanese: '翻译失败',
        chinese: text,
        source: 'api'
      };
    }
  }
}
