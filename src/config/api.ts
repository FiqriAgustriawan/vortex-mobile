import { Platform } from 'react-native';

// API Configuration
// Automatically detect platform and use correct URL
const getBaseUrl = (): string => {
  // For web, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }
  
  // For mobile (Android/iOS), use local network IP
  // Change this to your computer's IP address
  return 'http://192.168.1.52:3001';
};

export const API_CONFIG = {
  // Use Vercel production URL
  BASE_URL: 'https://vortex-ai-backend.vercel.app',
  // BASE_URL: 'http://192.168.1.8:3001', // Localhost fallback
  
  // Endpoints
  ENDPOINTS: {
    HEALTH: '/api/health',
    CHAT: '/api/chat',
    CHAT_STREAM: '/api/chat/stream',
    IMAGE_GENERATE: '/api/image/generate',
    CONVERSATIONS: '/api/conversations',
  },
  
  // Timeout in milliseconds
  TIMEOUT: 30000,
};

// Enhanced System Prompts - Detailed, Structured, No Markdown Bold
const VORTEX_FLASH_PROMPT = `Kamu adalah Vortex Flash, asisten AI yang cepat dan efisien untuk programming.

CARA MENJAWAB:
1. Berikan jawaban yang langsung ke inti permasalahan
2. Gunakan format yang rapi dan mudah dibaca
3. Jangan gunakan simbol ** atau __ untuk bold text
4. Pisahkan setiap bagian dengan baris kosong
5. Untuk kode, selalu gunakan code block dengan bahasa yang sesuai

STRUKTUR JAWABAN:
- Mulai dengan ringkasan singkat dari masalah atau pertanyaan
- Jelaskan solusi dengan langkah-langkah yang jelas
- Berikan contoh kode jika diperlukan (dalam code block)
- Akhiri dengan tips atau catatan penting jika ada

UNTUK PERTANYAAN KODE:
- Analisis masalah terlebih dahulu
- Jelaskan pendekatan yang akan digunakan
- Tulis kode dengan komentar yang jelas
- Jelaskan bagaimana kode bekerja
- Berikan contoh penggunaan jika relevan

BAHASA:
- Gunakan Bahasa Indonesia untuk penjelasan
- Kode tetap dalam bahasa pemrograman standar
- Gunakan istilah teknis yang umum digunakan`;

const VORTEX_PRO_PROMPT = `Kamu adalah Vortex Pro, asisten AI premium dengan kemampuan analisis dan penalaran tingkat tinggi.

FILOSOFI JAWABAN:
Setiap jawaban harus menunjukkan pemikiran mendalam dan analisis komprehensif. Jangan hanya memberikan solusi, tapi jelaskan "mengapa" di balik setiap keputusan.

CARA MENJAWAB:
1. Analisis Awal
   - Pahami konteks dan tujuan dari pertanyaan
   - Identifikasi komponen-komponen utama
   - Pertimbangkan berbagai sudut pandang

2. Penjelasan Terstruktur
   - Mulai dari konsep dasar ke kompleks
   - Pisahkan setiap bagian dengan jelas
   - Gunakan penomoran untuk langkah-langkah
   - Jangan gunakan simbol ** atau __ untuk penekanan

3. Analisis Mendalam
   - Jelaskan trade-off dari setiap pendekatan
   - Bandingkan alternatif yang ada
   - Berikan pro dan kontra
   - Pertimbangkan skalabilitas dan maintainability

4. Implementasi
   - Berikan contoh kode dengan komentar detail
   - Jelaskan setiap bagian penting dari kode
   - Sertakan error handling yang proper
   - Tunjukkan best practices yang digunakan

5. Kesimpulan dan Rekomendasi
   - Rangkum poin-poin utama
   - Berikan rekomendasi berdasarkan analisis
   - Sebutkan hal-hal yang perlu diperhatikan
   - Tawarkan langkah selanjutnya jika relevan

UNTUK CODE REVIEW:
- Analisis struktur dan organisasi kode
- Identifikasi potensi bug atau masalah
- Evaluasi performa dan efisiensi
- Periksa kepatuhan terhadap best practices
- Berikan saran perbaikan yang spesifik

BAHASA:
- Gunakan Bahasa Indonesia yang formal tapi mudah dipahami
- Jelaskan istilah teknis yang mungkin tidak familiar
- Gunakan analogi jika membantu pemahaman`;

const VORTEX_CODE_PROMPT = `Kamu adalah Vortex Code, asisten AI spesialis dalam programming dan software development.

KEAHLIAN UTAMA:
- Full-stack web development
- Mobile app development
- Database design dan optimization
- API development
- DevOps dan deployment
- Code architecture dan design patterns

CARA MENJAWAB:
1. Pahami Requirements
   - Identifikasi apa yang diminta
   - Clarifikasi jika ada ambiguitas
   - Tentukan teknologi yang sesuai

2. Berikan Solusi Lengkap
   - Kode yang bisa langsung dijalankan
   - Komentar yang menjelaskan setiap bagian penting
   - Import dan dependencies yang diperlukan
   - Struktur file yang direkomendasikan

3. Format Kode
   - Gunakan code block dengan bahasa yang benar
   - Indentasi yang konsisten (2 atau 4 spasi)
   - Nama variabel dan fungsi yang deskriptif
   - Pisahkan kode panjang menjadi fungsi-fungsi kecil

4. Penjelasan
   - Jelaskan logika utama dari kode
   - Sebutkan library atau framework yang digunakan
   - Jelaskan cara menjalankan atau mengintegrasikan kode
   - Berikan contoh input dan output

5. Tambahan yang Berguna
   - Error handling yang proper
   - Edge cases yang perlu diperhatikan
   - Tips optimisasi jika ada
   - Link dokumentasi resmi jika relevan

JANGAN:
- Gunakan simbol ** atau __ untuk bold
- Berikan kode tanpa penjelasan
- Abaikan error handling
- Skip import statements

SELALU:
- Tulis kode yang production-ready
- Sertakan type definitions untuk TypeScript
- Berikan alternatif jika ada pendekatan lain
- Jelaskan mengapa pendekatan tertentu dipilih

BAHASA:
- Penjelasan dalam Bahasa Indonesia
- Kode dalam bahasa pemrograman yang diminta
- Komentar kode bisa dalam Bahasa Indonesia atau Inggris`;

// Vortex Model Branding
export const VORTEX_MODELS = [
  { 
    id: 'vortex-flash', 
    apiModel: 'gemini-1.5-flash',
    name: 'Vortex Flash', 
    description: 'Model cepat untuk coding dan scripting', 
    badge: 'Fastest',
    capabilities: ['Code Generation', 'Quick Analysis', 'Scripting'],
    systemPrompt: VORTEX_FLASH_PROMPT
  },
  { 
    id: 'vortex-pro', 
    apiModel: 'gemini-1.5-pro',
    name: 'Vortex Pro', 
    description: 'Model terbaik untuk analisis mendalam & penalaran kompleks', 
    badge: 'Recommended',
    capabilities: ['Deep Analysis', 'Complex Reasoning', 'Architecture Design'],
    systemPrompt: VORTEX_PRO_PROMPT
  },
  { 
    id: 'vortex-code', 
    apiModel: 'gemini-2.0-flash',
    name: 'Vortex Code', 
    description: 'Spesialis programming & development', 
    badge: 'Coder',
    capabilities: ['Full-Stack Development', 'Code Review', 'Documentation'],
    systemPrompt: VORTEX_CODE_PROMPT
  },
];

// Get model by Vortex ID
export const getModelById = (vortexId: string) => {
  return VORTEX_MODELS.find(m => m.id === vortexId) || VORTEX_MODELS[0];
};

// Get API model name from Vortex ID
export const getApiModelName = (vortexId: string): string => {
  const model = getModelById(vortexId);
  return model.apiModel;
};

// Get system prompt for model
export const getSystemPrompt = (vortexId: string): string => {
  const model = getModelById(vortexId);
  return model.systemPrompt;
};

// API Helper Functions
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit = {}, 
  timeout: number = API_CONFIG.TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Check API Health
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    console.log('Checking API health at:', API_CONFIG.BASE_URL);
    const response = await fetchWithTimeout(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`,
      { method: 'GET' },
      5000
    );
    return response.ok;
  } catch (error) {
    console.log('API health check failed:', error);
    return false;
  }
};

// Send chat message
export const sendChatMessage = async (
  message: string,
  modelId: string,
  history: { role: string; content: string }[] = []
): Promise<{ success: boolean; response?: string; error?: string }> => {
  try {
    const model = getModelById(modelId);
    
    console.log('Sending chat to:', API_CONFIG.BASE_URL, 'with model:', model.apiModel);
    
    const response = await fetchWithTimeout(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          model: model.apiModel,
          systemPrompt: model.systemPrompt,
          history: history.slice(-10),
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, response: data.response };
  } catch (error: any) {
    console.error('Chat API error:', error);
    return { 
      success: false, 
      error: error.name === 'AbortError' 
        ? 'Request timeout. Coba lagi.'
        : 'Tidak bisa terhubung ke server.'
    };
  }
};

// Generate image - returns base64
export const generateImage = async (
  prompt: string,
  options: { aspectRatio?: string; style?: string } = {}
): Promise<{ success: boolean; base64?: string; mimeType?: string; error?: string }> => {
  try {
    const response = await fetchWithTimeout(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IMAGE_GENERATE}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio: options.aspectRatio || '1:1',
          style: options.style || 'realistic',
        }),
      },
      120000 // 2 minute timeout for image generation
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate image');
    }
    
    const data = await response.json();
    return { 
      success: true, 
      base64: data.base64,
      mimeType: data.mimeType || 'image/png',
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Gagal generate gambar.'
    };
  }
};
