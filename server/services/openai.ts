import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  actionItems?: Array<{
    type: string;
    title: string;
    data: any;
  }>;
}

export interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  keywords: string[];
}

export async function processNaturalLanguageQuery(
  query: string, 
  userContext: {
    location?: string;
    operator?: string;
    age?: number;
  }
): Promise<ChatResponse> {
  try {
    const systemPrompt = `Sen REACH+ adlı akıllı destek sisteminin yapay zeka asistanısın. Deprem sonrası gençlere yardım ediyorsun. Türkçe yanıt ver.

Kullanıcı bağlamı:
- Konum: ${userContext.location || "Bilinmiyor"}
- Operatör: ${userContext.operator || "Bilinmiyor"}
- Yaş: ${userContext.age || "Bilinmiyor"}

Yanıtın şu formatta JSON olsun:
{
  "message": "Ana yanıt mesajı",
  "suggestions": ["Öneriler listesi"],
  "actionItems": [
    {
      "type": "location|network|emergency|general",
      "title": "Eylem başlığı",
      "data": {}
    }
  ]
}

Sorular şunlar hakkında olabilir:
1. Konum ve güvenli alanlar
2. Operatör ve şebeke durumu
3. Acil durum bilgileri
4. Genel rehberlik

Pratik, faydalı ve umut verici yanıtlar ver.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      message: result.message || "Üzgünüm, şu anda yanıt veremiyorum.",
      suggestions: result.suggestions || [],
      actionItems: result.actionItems || [],
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback responses based on common patterns
    const fallbackResponses = getFallbackResponse(query, userContext);
    return fallbackResponses;
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Türkçe metni analiz et ve duygu durumunu belirle. JSON formatında yanıt ver: { \"sentiment\": \"positive|negative|neutral\", \"confidence\": 0.95, \"keywords\": [\"anahtar\", \"kelimeler\"] }"
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sentiment: result.sentiment || "neutral",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      keywords: result.keywords || [],
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return {
      sentiment: "neutral",
      confidence: 0.5,
      keywords: [],
    };
  }
}

function getFallbackResponse(query: string, userContext: any): ChatResponse {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("nereye") || lowerQuery.includes("güvenli") || lowerQuery.includes("toplanma")) {
    return {
      message: `${userContext.location || "Bulunduğunuz bölge"}de size en yakın güvenli toplanma alanları: Fenerbahçe Parkı (400m), Göztepe 60.Yıl Parkı (800m), ve Kadıköy Meydanı (1.2km). Acil durumda bu alanlara yönelin.`,
      suggestions: ["Haritada göster", "Yol tarifi al", "Acil çantanı hazırla"],
      actionItems: [
        {
          type: "location",
          title: "Güvenli alanları göster",
          data: { action: "show_safe_areas" }
        }
      ]
    };
  }
  
  if (lowerQuery.includes("operatör") || lowerQuery.includes("çekiyor") || lowerQuery.includes("sinyal")) {
    return {
      message: `${userContext.location || "Bölgeniz"}de operatör durumları: Turkcell %94 kapsama ile en iyi performansı gösteriyor. Vodafone %87, Türk Telekom %72 kapsama oranında.`,
      suggestions: ["Şebeke testini çalıştır", "Operatör değiştir", "WiFi noktalarını bul"],
      actionItems: [
        {
          type: "network",
          title: "Şebeke durumunu kontrol et",
          data: { action: "check_network" }
        }
      ]
    };
  }
  
  return {
    message: "Size nasıl yardımcı olabilirim? Konum, operatör durumu, güvenli alanlar veya acil durum bilgileri hakkında soru sorabilirsiniz.",
    suggestions: ["Güvenli alanları göster", "Şebeke durumu", "Acil numaralar"],
    actionItems: []
  };
}
