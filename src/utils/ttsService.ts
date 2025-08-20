// TTS服务 - 百度语音合成优先，浏览器内置语音兜底

interface TTSOptions {
  lang?: string;
  voice?: string;
  spd?: number; // 语速 0-15
  pit?: number; // 音调 0-15
  vol?: number; // 音量 0-15
  per?: number; // 发音人 0=女声, 1=男声
}

// 音频缓存
const audioCache = new Map<string, string>();

// 调用百度语音合成Edge Function
export async function generateSpeechBaidu(
  text: string, 
  options: TTSOptions = {}
): Promise<string> {
  const { 
    lang = 'jp', 
    spd = 5, 
    pit = 5, 
    vol = 7, 
    per = 0 
  } = options;
  
  console.log('🔊 开始生成语音 (百度TTS)');
  console.log('📝 文本:', text);
  console.log('🌐 语言:', lang);
  console.log('⚙️ 参数:', { spd, pit, vol, per });
  
  // 检查缓存
  const cacheKey = `baidu-${text}-${lang}-${spd}-${pit}-${vol}-${per}`;
  if (audioCache.has(cacheKey)) {
    console.log('✅ 从缓存获取音频');
    return audioCache.get(cacheKey)!;
  }
  
  try {
    // 调用Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL 未配置');
    }

    const apiUrl = `${supabaseUrl}/functions/v1/tts-baidu`;
    
    console.log('🎯 调用百度TTS Edge Function:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        text,
        lan: lang,
        spd,
        pit,
        vol,
        per
      })
    });
    
    console.log('📥 百度TTS Edge Function响应状态:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP错误: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ 百度TTS Edge Function响应成功');
    
    if (data.success && data.audioContent) {
      // 将Base64音频数据转换为Blob URL
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 缓存音频URL
      audioCache.set(cacheKey, audioUrl);
      
      console.log('🎉 百度语音生成成功');
      return audioUrl;
    }
    
    throw new Error('百度TTS结果为空');
    
  } catch (error) {
    console.error('❌ 百度TTS服务调用失败:', error);
    throw error;
  }
}

// 播放语音 - 百度TTS优先，浏览器内置兜底
export async function playText(text: string, options: TTSOptions = {}): Promise<void> {
  try {
    // 首先尝试百度TTS
    console.log('🎵 尝试使用百度TTS');
    const audioUrl = await generateSpeechBaidu(text, options);
    
    // 创建Audio对象并播放
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        console.log('✅ 百度TTS播放完成');
        resolve();
      };
      audio.onerror = (e) => {
        console.error('❌ 百度TTS音频播放失败:', e);
        reject(new Error('音频播放失败'));
      };
      
      audio.play().catch(reject);
    });
    
  } catch (error) {
    console.error('❌ 百度TTS失败，回退到浏览器内置语音:', error);
    // 如果百度TTS失败，回退到浏览器内置语音
    return playTextFallback(text);
  }
}

// 回退到浏览器内置语音
function playTextFallback(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('浏览器不支持语音合成'));
      return;
    }
    
    console.log('🔄 使用浏览器内置语音');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    
    // 尝试使用更自然的日语语音
    const voices = speechSynthesis.getVoices();
    const japaneseVoices = voices.filter(voice => 
      voice.lang.includes('ja') || voice.lang.includes('JP')
    );
    
    const preferredVoice = japaneseVoices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('女性') ||
      voice.name.includes('Kyoko') ||
      voice.name.includes('Otoya')
    ) || japaneseVoices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('🎤 使用语音:', preferredVoice.name);
    }
    
    utterance.onend = () => {
      console.log('✅ 浏览器内置语音播放完成');
      resolve();
    };
    utterance.onerror = (e) => {
      console.error('❌ 浏览器语音合成失败:', e);
      reject(new Error('语音合成失败'));
    };
    
    speechSynthesis.speak(utterance);
  });
}

// Base64转Blob工具函数
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// 清理音频缓存
export function clearAudioCache(): void {
  for (const url of audioCache.values()) {
    URL.revokeObjectURL(url);
  }
  audioCache.clear();
  console.log('🧹 音频缓存已清理');
}

// 预加载常用词汇的语音
export async function preloadCommonWords(words: string[]): Promise<void> {
  console.log('🔄 预加载常用词汇语音...');
  
  const promises = words.slice(0, 5).map(async (word) => {
    try {
      await generateSpeechBaidu(word);
      console.log(`✅ 预加载完成: ${word}`);
    } catch (error) {
      console.warn(`⚠️ 预加载失败: ${word}`, error);
    }
  });
  
  await Promise.allSettled(promises);
  console.log('🎉 常用词汇语音预加载完成');
}

// 语音设置选项
export const VOICE_OPTIONS = {
  // 发音人选项
  speakers: [
    { value: 0, label: '女声（温柔）', description: '标准女声，适合日常学习' },
    { value: 1, label: '男声（稳重）', description: '标准男声，发音清晰' },
    { value: 3, label: '度逍遥（情感）', description: '情感丰富的男声' },
    { value: 4, label: '度丫丫（活泼）', description: '活泼可爱的女声' }
  ],
  
  // 语速选项
  speeds: [
    { value: 3, label: '较慢', description: '适合初学者' },
    { value: 5, label: '正常', description: '标准语速' },
    { value: 7, label: '较快', description: '适合熟练者' },
    { value: 9, label: '很快', description: '挑战模式' }
  ],
  
  // 音调选项
  pitches: [
    { value: 3, label: '低音调', description: '低沉稳重' },
    { value: 5, label: '标准音调', description: '自然音调' },
    { value: 7, label: '高音调', description: '清脆明亮' }
  ]
};
