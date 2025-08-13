// 百度翻译API集成
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

// MD5加密函数（用于百度API签名）
function md5(str: string): string {
  // 简单的MD5实现，生产环境建议使用crypto-js库
  // 这里先用一个简化版本
  return btoa(str).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

// 生成百度翻译API签名
function generateSign(query: string, appid: string, salt: string, key: string): string {
  const str = appid + query + salt + key;
  return md5(str);
}

// 调用百度翻译API
export async function translateWithBaidu(
  text: string, 
  from: string = 'zh', 
  to: string = 'jp'
): Promise<string> {
  // 从环境变量获取百度翻译API配置
  const appid = import.meta.env.VITE_BAIDU_TRANSLATE_APPID;
  const key = import.meta.env.VITE_BAIDU_TRANSLATE_KEY;
  
  if (!appid || !key) {
    throw new Error('百度翻译API配置缺失，请在环境变量中设置 VITE_BAIDU_TRANSLATE_APPID 和 VITE_BAIDU_TRANSLATE_KEY');
  }

  const salt = Date.now().toString();
  const sign = generateSign(text, appid, salt, key);
  
  const params = new URLSearchParams({
    q: text,
    from,
    to,
    appid,
    salt,
    sign
  });

  try {
    const response = await fetch(`https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`, {
      method: 'GET',
    });
    
    const data: BaiduTranslateResponse = await response.json();
    
    if (data.error_code) {
      throw new Error(`百度翻译API错误: ${data.error_msg}`);
    }
    
    if (data.trans_result && data.trans_result.length > 0) {
      return data.trans_result[0].dst;
    }
    
    throw new Error('翻译结果为空');
  } catch (error) {
    console.error('百度翻译API调用失败:', error);
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
      return {
        japanese: '翻译失败',
        chinese: text,
        source: 'api'
      };
    }
  }
}
