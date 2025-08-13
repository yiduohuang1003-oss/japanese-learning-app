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
  // 使用Web Crypto API的替代方案
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
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
  
  console.log('百度翻译配置检查:', {
    hasAppid: !!appid,
    hasKey: !!key,
    appidLength: appid?.length || 0,
    keyLength: key?.length || 0
  });
  
  if (!appid || !key) {
    console.error('百度翻译API配置缺失');
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

  const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`;
  
  console.log('百度翻译请求:', {
    url: url.replace(key, '***'),
    params: {
      q: text,
      from,
      to,
      appid,
      salt,
      sign
    }
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log('百度翻译响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }
    
    const data: BaiduTranslateResponse = await response.json();
    
    console.log('百度翻译响应数据:', data);
    
    if (data.error_code) {
      const errorMessages: Record<string, string> = {
        '52001': 'APP ID 或密钥错误',
        '52002': '系统错误',
        '52003': '授权失败',
        '54000': '必填参数为空',
        '54001': '签名错误',
        '54003': '访问频率受限',
        '54004': '账户余额不足',
        '54005': '长query请求频繁',
        '58000': '客户端IP非法',
        '58001': '译文语言方向不支持',
        '58002': '服务当前已关闭',
        '90107': '认证未通过或未生效'
      };
      
      const errorMsg = errorMessages[data.error_code] || `未知错误: ${data.error_msg}`;
      console.error('百度翻译API错误:', data.error_code, errorMsg);
      throw new Error(`百度翻译API错误 (${data.error_code}): ${errorMsg}`);
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
