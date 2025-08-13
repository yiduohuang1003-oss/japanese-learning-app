import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface TranslateRequest {
  text: string;
  from?: string;
  to?: string;
}

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

// MD5加密函数 - 使用Web Crypto API
async function md5(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 生成百度翻译API签名
async function generateSign(query: string, appid: string, salt: string, key: string): Promise<string> {
  const str = appid + query + salt + key;
  return await md5(str);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // 处理预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // 从环境变量获取百度翻译API配置
    const appid = Deno.env.get('BAIDU_TRANSLATE_APPID');
    const key = Deno.env.get('BAIDU_TRANSLATE_KEY');
    
    console.log('环境变量检查:', {
      appid: appid ? '已设置' : '未设置',
      key: key ? '已设置' : '未设置'
    });
    
    if (!appid || !key) {
      console.error('百度翻译API配置缺失');
      return new Response(
        JSON.stringify({ 
          error: '百度翻译API配置缺失',
          details: 'BAIDU_TRANSLATE_APPID 和 BAIDU_TRANSLATE_KEY 环境变量未设置'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 解析请求体
    const { text, from = 'zh', to = 'jp' }: TranslateRequest = await req.json();
    
    if (!text || text.trim() === '') {
      return new Response(
        JSON.stringify({ error: '翻译文本不能为空' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 生成签名参数
    const salt = Date.now().toString();
    const sign = await generateSign(text, appid, salt, key);
    
    // 构建请求参数
    const params = new URLSearchParams({
      q: text,
      from,
      to,
      appid,
      salt,
      sign
    });

    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`;
    
    console.log('调用百度翻译API:', {
      text,
      from,
      to,
      appid,
      salt
    });

    // 调用百度翻译API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Japanese Learning App)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }
    
    const data: BaiduTranslateResponse = await response.json();
    
    console.log('百度翻译API响应:', data);
    
    // 检查API错误
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
      
      return new Response(
        JSON.stringify({ 
          error: `百度翻译API错误 (${data.error_code}): ${errorMsg}`,
          code: data.error_code
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 返回翻译结果
    if (data.trans_result && data.trans_result.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          result: data.trans_result[0].dst,
          from: data.from,
          to: data.to,
          original: text
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw new Error('翻译结果为空');
    
  } catch (error) {
    console.error('翻译服务错误:', error);
    return new Response(
      JSON.stringify({ 
        error: '翻译服务错误',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
