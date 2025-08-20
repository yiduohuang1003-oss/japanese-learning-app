import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface TTSRequest {
  text: string;
  spd?: number; // 语速，取值0-15，默认为5中语速
  pit?: number; // 音调，取值0-15，默认为5中语调
  vol?: number; // 音量，取值0-15，默认为5中音量
  per?: number; // 发音人选择，0为女声，1为男声，3为情感合成-度逍遥，4为情感合成-度丫丫
  lan?: string; // 语言选择，zh为中文，en为英文，jp为日语
}

// MD5加密函数
async function md5(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    // 从环境变量获取百度语音合成API配置
    const apiKey = Deno.env.get('BAIDU_TTS_API_KEY');
    const secretKey = Deno.env.get('BAIDU_TTS_SECRET_KEY');
    
    console.log('环境变量检查:', {
      apiKey: apiKey ? '已设置' : '未设置',
      secretKey: secretKey ? '已设置' : '未设置'
    });
    
    if (!apiKey || !secretKey) {
      console.error('百度语音合成API配置缺失');
      return new Response(
        JSON.stringify({ 
          error: '百度语音合成API配置缺失',
          details: 'BAIDU_TTS_API_KEY 和 BAIDU_TTS_SECRET_KEY 环境变量未设置'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 解析请求体
    const { 
      text, 
      spd = 5, 
      pit = 5, 
      vol = 5, 
      per = 0, 
      lan = 'jp' 
    }: TTSRequest = await req.json();
    
    if (!text || text.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'TTS文本不能为空' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('调用百度语音合成API:', {
      text,
      spd,
      pit,
      vol,
      per,
      lan
    });

    // 第一步：获取Access Token
    const tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token';
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: secretKey
    });

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    if (!tokenResponse.ok) {
      throw new Error(`获取Access Token失败: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error(`Access Token响应异常: ${JSON.stringify(tokenData)}`);
    }

    console.log('成功获取Access Token');

    // 第二步：调用语音合成API
    const ttsUrl = 'https://tsn.baidu.com/text2audio';
    
    // 构建请求参数
    const ttsParams = new URLSearchParams({
      tex: text,
      tok: tokenData.access_token,
      cuid: 'japanese_learning_app',
      ctp: '1', // 客户端类型固定为1
      lan: lan,
      spd: spd.toString(),
      pit: pit.toString(),
      vol: vol.toString(),
      per: per.toString(),
      aue: '3' // 音频格式，3为mp3格式
    });

    const ttsResponse = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; Japanese Learning App)'
      },
      body: ttsParams
    });
    
    if (!ttsResponse.ok) {
      throw new Error(`百度TTS API错误: ${ttsResponse.status}`);
    }
    
    // 检查响应类型
    const contentType = ttsResponse.headers.get('content-type') || '';
    
    if (contentType.includes('audio')) {
      // 成功返回音频数据
      const audioBuffer = await ttsResponse.arrayBuffer();
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      
      console.log('百度TTS API响应成功，音频大小:', audioBuffer.byteLength);
      
      return new Response(
        JSON.stringify({
          success: true,
          audioContent: audioBase64,
          format: 'mp3',
          source: 'baidu'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      // 返回的是错误信息
      const errorData = await ttsResponse.json();
      console.error('百度TTS API错误响应:', errorData);
      
      const errorMessages: Record<string, string> = {
        '500': '不支持输入',
        '501': '输入参数不正确',
        '502': 'token验证失败',
        '503': '合成后端错误',
        '3300': '输入参数不正确',
        '3301': '音频转码失败',
        '3302': '音频转码失败',
        '3303': '服务器内部错误'
      };
      
      const errorCode = errorData.err_no?.toString() || 'unknown';
      const errorMsg = errorMessages[errorCode] || `未知错误: ${errorData.err_msg || '无详细信息'}`;
      
      return new Response(
        JSON.stringify({ 
          error: `百度TTS API错误 (${errorCode}): ${errorMsg}`,
          code: errorCode
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
  } catch (error) {
    console.error('百度TTS服务错误:', error);
    return new Response(
      JSON.stringify({ 
        error: '百度TTS服务错误',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
