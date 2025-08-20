import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface TTSRequest {
  text: string;
  lang?: string;
  voice?: string;
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
    // 从环境变量获取Google Cloud TTS API配置
    const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    
    if (!googleApiKey) {
      console.error('Google Cloud API Key未配置');
      return new Response(
        JSON.stringify({ 
          error: 'TTS服务配置缺失',
          details: 'GOOGLE_CLOUD_API_KEY 环境变量未设置'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 解析请求体
    const { text, lang = 'ja-JP', voice = 'ja-JP-Standard-A' }: TTSRequest = await req.json();
    
    if (!text || text.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'TTS文本不能为空' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('调用Google Cloud TTS API:', {
      text,
      lang,
      voice
    });

    // 构建Google Cloud TTS API请求
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`;
    
    const requestBody = {
      input: {
        text: text
      },
      voice: {
        languageCode: lang,
        name: voice,
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9,
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };

    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google TTS API错误: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    console.log('Google TTS API响应成功');
    
    // 返回音频数据
    if (data.audioContent) {
      return new Response(
        JSON.stringify({
          success: true,
          audioContent: data.audioContent, // Base64编码的音频数据
          format: 'mp3'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw new Error('TTS结果为空');
    
  } catch (error) {
    console.error('TTS服务错误:', error);
    return new Response(
      JSON.stringify({ 
        error: 'TTS服务错误',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
