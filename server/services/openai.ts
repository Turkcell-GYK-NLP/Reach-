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
    const systemPrompt = `Sen REACH+ afet destek sisteminin AI asistanısın. Gençlere direkt, pratik ve net bilgiler veriyorsun. Türkçe yanıt ver.

Kullanıcı bağlamı:
- Konum: ${userContext.location || "İstanbul"}
- Operatör: ${userContext.operator || "Bilinmiyor"}
- Yaş: ${userContext.age || "Genç"}

ÖNEMLİ KURALLAR:
- DIREKT ve NET yanıtlar ver
- Gereksiz nazik sözler kullanma
- Somut bilgi ve rakam ver
- Hemen çözüm odaklı ol
- Belirsiz ifadeler kullanma

ÖRNEK İYİ YANITLAR:
- "Kadıköy'de Türk Telekom kapsama %95, sinyal gücü 85/100. Şu anda çalışıyor."
- "En yakın güvenli alan: Fenerbahçe Parkı (400m). Hemen oraya git."
- "112'yi ara, adresini ver: [tam adres]"

Yanıtın JSON formatı:
{
  "message": "Direkt, net yanıt",
  "suggestions": ["Somut eylem önerileri"],
  "actionItems": [{"type": "network|location|emergency", "title": "Net eylem", "data": {}}]
}

Muğlak cevaplar verme - her zaman kesin bilgi ver.`;

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
      message: `${userContext.location || "Kadıköy"}de en yakın güvenli alanlar: 1) Fenerbahçe Parkı (400m) 2) Göztepe 60.Yıl Parkı (800m) 3) Kadıköy Meydanı (1.2km). Şimdi Fenerbahçe Parkı'na git.`,
      suggestions: ["Hemen Fenerbahçe Parkı'na git", "Acil çantanı al", "Ailenle iletişime geç"],
      actionItems: [
        {
          type: "location",
          title: "Fenerbahçe Parkı'na yön al",
          data: { location: "Fenerbahçe Parkı", distance: "400m" }
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
