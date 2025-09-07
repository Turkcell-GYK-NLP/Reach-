import OpenAI from "openai";
import { locationService } from "./locationService";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "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"
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
    // Gerçek konum bilgisini al
    const currentLocation = await locationService.getCurrentLocation();
    const nearestSafeArea = await locationService.getNearestSafeArea();
    
    const systemPrompt = `Sen REACH+ afet destek sisteminin AI asistanısın. Gençlere direkt, pratik ve net bilgiler veriyorsun. Türkçe yanıt ver.

Kullanıcı bağlamı:
- Gerçek Konum: ${currentLocation.city}, ${currentLocation.district} (${currentLocation.latitude}, ${currentLocation.longitude})
- En Yakın Güvenli Alan: ${nearestSafeArea.name} (${nearestSafeArea.distance}m uzaklıkta)
- Operatör: ${userContext.operator || "Bilinmiyor"}
- Yaş: ${userContext.age || "Genç"}

ÖNEMLİ KURALLAR:
- DIREKT ve NET yanıtlar ver
- Somut bilgi ve rakam ver
- Hemen çözüm odaklı ol
- Belirsiz ifadeler kullanma
- Kullanıcıya nazik ol
- Kullanıcının gerçek konumunu kullan
- En yakın güvenli alanı öner
- Koordinatları biliyorsun. Buna göre yol tarifi ver.

SUGGESTION KURALLARI:
- Suggestion'lar kullanıcının bir sonraki soracağı soru gibi olmalı
- "Nasıl", "Nerede", "Ne zaman", "Hangi" gibi soru kelimeleri kullan
- Kullanıcının verdiğin bilgiyi nasıl kullanacağını düşün
- Örnek: "Güvenli alan" cevabından sonra "Oraya nasıl giderim?" suggestion'ı ver

ÖRNEK İYİ YANITLAR:
- "${currentLocation.district}'de Türk Telekom kapsama %95, sinyal gücü 85/100. Şu anda çalışıyor."
- "En yakın güvenli alan: ${nearestSafeArea.name} (${nearestSafeArea.distance}m). Hemen oraya git."
- "112'yi ara, adresini ver: ${currentLocation.address}"

ÖRNEK SUGGESTION'LAR:
- Güvenli alan cevabından sonra: ["Oraya nasıl giderim?", "Acil çantamı alayım mı?", "Ailemle nasıl iletişime geçerim?"]
- Operatör cevabından sonra: ["Şebekemi nasıl test ederim?", "Hangi operatörü kullanmalıyım?", "WiFi noktaları nerede?"]
- Yol tarifi cevabından sonra: ["Hangi otobüsler gidiyor?", "Yürüyerek ne kadar sürer?", "Taksi ücreti ne kadar?"]

GOOGLE MAPS ENTEGRASYONU:
- Yol tarifi verirken Google Maps linki ekle
- Kullanıcının gerçek konumundan başlayarak yönlendir
- Link formatı: https://www.google.com/maps/dir/?api=1&origin=KULLANICI_LAT,KULLANICI_LNG&destination=HEDEF_LAT,HEDEF_LNG&travelmode=walking

Yanıtın JSON formatı:
{
  "message": "Direkt, net yanıt",
  "suggestions": ["Kullanıcının bir sonraki soracağı soru gibi suggestion'lar"],
  "actionItems": [{"type": "network|location|emergency", "title": "Net eylem", "data": {}}]
}

Muğlak cevaplar verme - her zaman kesin bilgi ver.`;

    const response = await openai.chat.completions.create({
      // use model gpt-4o-mini
      model: "gpt-4o-mini",
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
    const fallbackResponses = await getFallbackResponse(query, userContext);
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

async function getFallbackResponse(query: string, userContext: any): Promise<ChatResponse> {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("nereye") || lowerQuery.includes("güvenli") || lowerQuery.includes("toplanma")) {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      const nearestSafeArea = await locationService.getNearestSafeArea();
      
      const fenerbahceCoords = "40.9839,29.0365";
      const goztepeCoords = "40.9751,29.0515";
      const kadikoyCoords = "40.9903,29.0264";
      
      return {
        message: `${currentLocation.district}de en yakın güvenli alan: ${nearestSafeArea.name} (${nearestSafeArea.distance}m). Şimdi ${nearestSafeArea.name}'na git.`,
        suggestions: ["Oraya nasıl giderim?", "Acil çantamı alayım mı?", "Ailemle nasıl iletişime geçerim?"],
        actionItems: [
          {
            type: "location",
            title: `${nearestSafeArea.name}'na Yön Al`,
            data: { 
              location: nearestSafeArea.name, 
              distance: `${nearestSafeArea.distance}m`,
              coordinates: `${nearestSafeArea.coordinates.lat},${nearestSafeArea.coordinates.lng}`
            }
          }
        ]
      };
    } catch (error) {
      // Fallback to static data if location service fails
      const fenerbahceCoords = "40.9839,29.0365";
      const goztepeCoords = "40.9751,29.0515";
      const kadikoyCoords = "40.9903,29.0264";
      
      return {
        message: `${userContext.location || "Bölgeniz"}de güvenli alanlar için konumunuzu paylaşın. Gerçek zamanlı verilerle size yardımcı olabilirim.`,
        suggestions: ["Oraya nasıl giderim?", "Acil çantamı alayım mı?", "Ailemle nasıl iletişime geçerim?"],
        actionItems: []
      };
    }
  }
  
  if (lowerQuery.includes("operatör") || lowerQuery.includes("çekiyor") || lowerQuery.includes("sinyal")) {
    return {
      message: `${userContext.location || "Bölgeniz"}de operatör durumları: Turkcell %94 kapsama ile en iyi performansı gösteriyor. Vodafone %87, Türk Telekom %72 kapsama oranında.`,
      suggestions: ["Şebekemi nasıl test ederim?", "Hangi operatörü kullanmalıyım?", "WiFi noktaları nerede?"],
      actionItems: [
        {
          type: "network",
          title: "Şebeke durumunu kontrol et",
          data: { action: "check_network" }
        }
      ]
    };
  }
  
  if (lowerQuery.includes("nasıl giderim") || lowerQuery.includes("yol tarifi")) {
    return {
      message: `Yol tarifi için önce gideceğiniz güvenli alanı belirtin. Konumunuzu paylaştığınızda size en uygun rotayı gösterebilirim.`,
      suggestions: ["Güvenli alanları göster", "En yakın alan nerede?", "Hangi ulaşım araçları var?"],
      actionItems: []
    };
  }
  
  if (lowerQuery.includes("acil çanta") || lowerQuery.includes("hazırlık")) {
    return {
      message: "Acil çantanızda şunlar olmalı: Su, konserve yiyecek, ilk yardım malzemeleri, el feneri, pil, şarj cihazı, kimlik fotokopisi, para, düdük. Hemen hazırlayın.",
      suggestions: ["Hangi yiyecekleri almalıyım?", "İlk yardım çantası nerede bulunur?", "Başka ne hazırlamalıyım?"],
      actionItems: [
        {
          type: "emergency",
          title: "Acil çanta hazırla",
          data: { action: "prepare_emergency_kit" }
        }
      ]
    };
  }
  
  if (lowerQuery.includes("aile") || lowerQuery.includes("iletişim")) {
    return {
      message: "Ailenizle iletişime geçmek için: Önce SMS deneyin, internet varsa WhatsApp kullanın. Şebeke yoksa yakındaki WiFi noktalarını arayın. Acil durumda 112 üzerinden mesaj gönderebilirsiniz.",
      suggestions: ["SMS gönderemiyorum, ne yapayım?", "WiFi noktaları nerede?", "112'den nasıl mesaj gönderirim?"],
      actionItems: [
        {
          type: "communication",
          title: "Aile iletişimi",
          data: { action: "contact_family" }
        }
      ]
    };
  }
  
  return {
    message: "Size nasıl yardımcı olabilirim? Konum, operatör durumu, güvenli alanlar veya acil durum bilgileri hakkında soru sorabilirsiniz.",
    suggestions: ["Güvenli alanları göster", "Şebeke durumu nasıl?", "Acil numaralar neler?"],
    actionItems: []
  };
}
