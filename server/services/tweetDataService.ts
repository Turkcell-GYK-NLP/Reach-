import path from "path";
import fs from "fs";
import XLSX from "xlsx";

export interface RawTweetRow {
  tweet_id?: string | number;
  episode_id?: string | number;
  timestamp_tr?: string;
  user_handle?: string;
  afet_turu?: string;
  region?: string;
  il?: string;
  ilce?: string;
  latitude?: number | string;
  longitude?: number | string;
  afet_yeri?: string;
  konum_bilgisi?: string;
  yardim_konusu?: string;
  contact_method?: string;
  contact_masked?: string;
  verified_contact?: string | boolean;
  tweet_metin?: string;
}

export type Sentiment = "positive" | "negative" | "neutral";

export interface ParsedTweet {
  id: string;
  timestamp: Date | null;
  timestampLabel: string;
  author: string;
  text: string;
  il?: string;
  ilce?: string;
  region?: string;
  latitude?: number | null;
  longitude?: number | null;
  disasterType?: string;
  helpTopic?: string;
  sentiment: Sentiment;
}

export interface TweetAnalytics {
  totalPosts: number;
  sentimentShare: { positive: number; neutral: number; negative: number };
  trendingTopics: Array<{ topic: string; count: number; sentiment: number }>;
}

export interface TweetDensityData {
  il: string;
  count: number;
  latitude?: number;
  longitude?: number;
  sentiment: { positive: number; neutral: number; negative: number };
}

export interface TrendingTopicData {
  il: string;
  latitude?: number;
  longitude?: number;
  topics: Array<{
    topic: string;
    count: number;
    percentage: number;
    sentiment: number;
    category: string;
  }>;
  totalTweets: number;
}

class TweetDataService {
  private cache: ParsedTweet[] = [];
  private lastLoad?: number;
  private readonly filePath: string;

  constructor() {
    this.filePath = path.resolve(process.cwd(), "new_datas/afet_yardim_tweetleri_5000_FINAL_noemoji_includes_istanbul_2025_04.xlsx");
  }

  async ensureLoaded(force = false) {
    if (!force && this.cache.length > 0 && this.lastLoad && Date.now() - this.lastLoad < 5 * 60 * 1000) {
      return;
    }
    if (!fs.existsSync(this.filePath)) {
      console.warn(`[TweetDataService] Excel dosyası bulunamadı: ${this.filePath}`);
      this.cache = [];
      this.lastLoad = Date.now();
      return;
    }

    let rows: any[] = [];
    try {
      const workbook = XLSX.readFile(this.filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];
    } catch (err) {
      console.error("[TweetDataService] XLSX okuma hatası:", err);
      this.cache = [];
      this.lastLoad = Date.now();
      return;
    }

    const normalized = rows.map(r => this.normalizeRowKeys(r));
    this.cache = normalized.map((r): ParsedTweet => {
      const id = String(this.coalesce(r, ["tweet_id", "id", "episode_id"]) ?? Math.random().toString(36).slice(2));
      const tsVal = this.coalesce(r, ["timestamp_tr", "timestamp", "created_at", "tarih", "zaman"]);
      const ts = this.parseTimestamp(tsVal);
      const [lat, lng] = [this.numOrNull(this.coalesce(r, ["latitude", "lat", "enlem"])), this.numOrNull(this.coalesce(r, ["longitude", "lng", "lon", "boylam"]))];
      const text = String(this.coalesce(r, ["tweet_metin", "tweet_text", "text", "tweet", "metin"]) || "").trim();
      // Eğer timestamp yoksa, bu kaydı filtrelemelerde belirsizlik yaratmaması için en sona atabilmek adına timestamp'ı null bırakıyoruz
      return {
        id,
        timestamp: ts,
        timestampLabel: ts ? ts.toLocaleString("tr-TR") : (tsVal ? String(tsVal) : ""),
        author: String(this.coalesce(r, ["user_handle", "kullanici", "author", "hesap"]) || "@anon"),
        text,
        il: (this.coalesce(r, ["il", "sehir"])) ? String(this.coalesce(r, ["il", "sehir"])) : undefined,
        ilce: r.ilce ? String(r.ilce) : (this.coalesce(r, ["ilce", "il_ce"]) ? String(this.coalesce(r, ["ilce", "il_ce"])) : undefined),
        region: r.region ? String(r.region) : undefined,
        latitude: lat,
        longitude: lng,
        disasterType: (this.coalesce(r, ["afet_turu", "afet", "afet_tur"])) ? String(this.coalesce(r, ["afet_turu", "afet", "afet_tur"])) : undefined,
        helpTopic: (this.coalesce(r, ["yardim_konusu", "yardim", "yardim_tema"])) ? String(this.coalesce(r, ["yardim_konusu", "yardim", "yardim_tema"])) : undefined,
        sentiment: this.estimateSentiment(text),
      };
    });

    // Sort by timestamp desc if available
    this.cache.sort((a, b) => {
      if (a.timestamp && b.timestamp) return b.timestamp.getTime() - a.timestamp.getTime();
      if (a.timestamp) return -1;
      if (b.timestamp) return 1;
      return 0;
    });

    this.lastLoad = Date.now();
    console.log(`[TweetDataService] Excel'den okunan satır: ${rows.length}, parse edilen: ${this.cache.length}`);
    if (this.cache.length === 0 && rows[0]) {
      console.warn("[TweetDataService] İlk satır anahtarları:", Object.keys(rows[0]));
    }
  }

  getRecent(limit = 20, timeframe?: string, startDateStr?: string, endDateStr?: string): ParsedTweet[] {
    const list = this.filterByTimeframe(this.cache, timeframe, startDateStr, endDateStr);
    return list.slice(0, limit);
  }

  getAnalytics(timeframe?: string, startDateStr?: string, endDateStr?: string): TweetAnalytics {
    const list = this.filterByTimeframe(this.cache, timeframe, startDateStr, endDateStr);
    const total = list.length;

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 } as Record<Sentiment, number> & { [k: string]: number };
    for (const t of list) sentimentCounts[t.sentiment]++;

    const trendingMap = new Map<string, { count: number; sentimentSum: number }>();
    for (const t of list) {
      const keys = this.extractKeywords(t.text);
      const sentimentScore = this.sentimentToScore(t.sentiment);
      for (const k of keys) {
        const prev = trendingMap.get(k) || { count: 0, sentimentSum: 0 };
        prev.count += 1;
        prev.sentimentSum += sentimentScore;
        trendingMap.set(k, prev);
      }
    }
    const trendingTopics = Array.from(trendingMap.entries())
      .map(([topic, v]) => ({ topic, count: v.count, sentiment: Math.round(((v.sentimentSum / Math.max(v.count, 1)) + 1) * 50) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalPosts: total,
      sentimentShare: {
        positive: total ? Math.round((sentimentCounts.positive / total) * 100) : 0,
        neutral: total ? Math.round((sentimentCounts.neutral / total) * 100) : 0,
        negative: total ? Math.round((sentimentCounts.negative / total) * 100) : 0,
      },
      trendingTopics,
    };
  }

  getTweetDensityByCity(timeframe?: string, startDateStr?: string, endDateStr?: string): TweetDensityData[] {
    const list = this.filterByTimeframe(this.cache, timeframe, startDateStr, endDateStr);
    const cityMap = new Map<string, { count: number; sentimentCounts: { positive: number; neutral: number; negative: number }; latitude?: number; longitude?: number }>();

    for (const tweet of list) {
      if (!tweet.il) continue;
      
      const city = tweet.il.toLowerCase().trim();
      const existing = cityMap.get(city) || { count: 0, sentimentCounts: { positive: 0, neutral: 0, negative: 0 } };
      
      existing.count += 1;
      existing.sentimentCounts[tweet.sentiment] += 1;
      
      // İlk koordinatları al (varsa)
      if (tweet.latitude && tweet.longitude && !existing.latitude) {
        existing.latitude = tweet.latitude;
        existing.longitude = tweet.longitude;
      }
      
      cityMap.set(city, existing);
    }

    return Array.from(cityMap.entries())
      .map(([city, data]) => ({
        il: city,
        count: data.count,
        latitude: data.latitude,
        longitude: data.longitude,
        sentiment: {
          positive: data.count ? Math.round((data.sentimentCounts.positive / data.count) * 100) : 0,
          neutral: data.count ? Math.round((data.sentimentCounts.neutral / data.count) * 100) : 0,
          negative: data.count ? Math.round((data.sentimentCounts.negative / data.count) * 100) : 0,
        }
      }))
      .sort((a, b) => b.count - a.count);
  }

  getTrendingTopicsByRegion(timeframe?: string, startDateStr?: string, endDateStr?: string): TrendingTopicData[] {
    const list = this.filterByTimeframe(this.cache, timeframe, startDateStr, endDateStr);
    const cityMap = new Map<string, { 
      tweets: ParsedTweet[], 
      latitude?: number, 
      longitude?: number 
    }>();

    // İllere göre tweet'leri grupla
    for (const tweet of list) {
      if (!tweet.il) continue;
      
      const city = tweet.il.toLowerCase().trim();
      const existing = cityMap.get(city) || { tweets: [] };
      existing.tweets.push(tweet);
      
      // İlk koordinatları al (varsa)
      if (tweet.latitude && tweet.longitude && !existing.latitude) {
        existing.latitude = tweet.latitude;
        existing.longitude = tweet.longitude;
      }
      
      cityMap.set(city, existing);
    }

    return Array.from(cityMap.entries()).map(([city, data]) => {
      const tweets = data.tweets;
      const totalTweets = tweets.length;
      
      // Her tweet'ten konuları çıkar ve kategorize et
      const topicMap = new Map<string, { count: number; sentimentSum: number; category: string }>();
      
      for (const tweet of tweets) {
        const keywords = this.extractKeywords(tweet.text);
        const sentimentScore = this.sentimentToScore(tweet.sentiment);
        
        for (const keyword of keywords) {
          const category = this.categorizeTopic(keyword);
          const existing = topicMap.get(keyword) || { count: 0, sentimentSum: 0, category };
          existing.count += 1;
          existing.sentimentSum += sentimentScore;
          topicMap.set(keyword, existing);
        }
      }
      
      // Konuları sayıya göre sırala ve yüzde hesapla
      const topics = Array.from(topicMap.entries())
        .map(([topic, data]) => ({
          topic,
          count: data.count,
          percentage: totalTweets ? Math.round((data.count / totalTweets) * 100) : 0,
          sentiment: Math.round(((data.sentimentSum / Math.max(data.count, 1)) + 1) * 50),
          category: data.category
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // En çok 10 konu
      
      return {
        il: city,
        latitude: data.latitude,
        longitude: data.longitude,
        topics,
        totalTweets
      };
    }).filter(data => data.totalTweets > 0)
      .sort((a, b) => b.totalTweets - a.totalTweets);
  }

  private categorizeTopic(topic: string): string {
    const t = topic.toLowerCase();
    
    // İnternet ve iletişim
    if (["internet", "şebeke", "çekmiyor", "wifi", "mobil", "veri", "bağlantı", "sinyal", "telefon", "gsm"].some(keyword => t.includes(keyword))) {
      return "İnternet & İletişim";
    }
    
    // Deprem ve afet
    if (["deprem", "sarsıntı", "titreşim", "kandilli", "afad", "enkaz", "yıkım", "çökme", "hasar"].some(keyword => t.includes(keyword))) {
      return "Deprem & Afet";
    }
    
    // Yardım ve destek
    if (["yardım", "destek", "yardım", "bağış", "gönüllü", "gıda", "su", "barınma", "sığınak", "toplanma"].some(keyword => t.includes(keyword))) {
      return "Yardım & Destek";
    }
    
    // Sağlık ve ilkyardım
    if (["ilkyardım", "sağlık", "hastane", "doktor", "ambulans", "yaralı", "tedavi", "ilaç"].some(keyword => t.includes(keyword))) {
      return "Sağlık & İlkyardım";
    }
    
    // Güvenlik ve emniyet
    if (["güvenli", "emniyet", "polis", "jandarma", "güvenlik", "sığınak", "kaçış", "tahliye"].some(keyword => t.includes(keyword))) {
      return "Güvenlik & Emniyet";
    }
    
    // Ulaşım ve lojistik
    if (["yol", "ulaşım", "trafik", "araç", "otobüs", "metro", "köprü", "tünel"].some(keyword => t.includes(keyword))) {
      return "Ulaşım & Lojistik";
    }
    
    // Enerji ve altyapı
    if (["elektrik", "enerji", "gaz", "su", "kanalizasyon", "altyapı", "çökme", "patlama"].some(keyword => t.includes(keyword))) {
      return "Enerji & Altyapı";
    }
    
    return "Diğer";
  }

  private parseDateSafe(input: string): Date | null {
    if (!input) return null;
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d;
    // Try DD.MM.YYYY HH:mm pattern
    const m = input.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const year = parseInt(m[3].length === 2 ? `20${m[3]}` : m[3], 10);
      const hour = m[4] ? parseInt(m[4], 10) : 0;
      const minute = m[5] ? parseInt(m[5], 10) : 0;
      const dd = new Date(year, month, day, hour, minute);
      return isNaN(dd.getTime()) ? null : dd;
    }
    return null;
  }

  private numOrNull(v: any): number | null {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  private parseTimestamp(val: any): Date | null {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "number") {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const ms = val * 24 * 60 * 60 * 1000;
      const d = new Date(excelEpoch.getTime() + ms);
      return isNaN(d.getTime()) ? null : d;
    }
    return this.parseDateSafe(String(val));
  }

  private estimateSentiment(text: string): Sentiment {
    const lower = (text || "").toLowerCase();
    const positives = ["teşekkür", "başarılı", "iyi", "güzel", "yardım geldi", "çözüldü", "şükür"];
    const negatives = ["acil", "yardım", "enkaz", "çekmiyor", "kayıp", "ölüm", "yaralı", "sorun", "yıkıldı", "çöktü"];
    let score = 0;
    for (const p of positives) if (lower.includes(p)) score += 1;
    for (const n of negatives) if (lower.includes(n)) score -= 1;
    if (score > 0) return "positive";
    if (score < 0) return "negative";
    return "neutral";
  }

  private extractKeywords(text: string): string[] {
    const t = (text || "").toLowerCase();
    const hashtagMatches = Array.from(t.matchAll(/#([A-Za-z0-9_ğüşöçıİĞÜŞÖÇ]+)/g)).map(m => m[1]);
    const tokens = t
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^A-Za-z0-9#ğüşöçıİĞÜŞÖÇ\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const stopwords = new Set(["ve", "ile", "de", "da", "için", "mi", "mu", "mü", "musun", "mısın", "çok", "bir", "şu", "bu", "o", "ya", "ama", "fakat", "gibi"]);
    const base = tokens.filter(w => !stopwords.has(w) && w.length >= 3 && !/^\d+$/.test(w) && !w.startsWith("#"));
    const domain = ["deprem", "yardım", "enkaz", "afad", "kandilli", "ilkyardım", "toplanma", "güvenli", "internet", "çekmiyor", "şebeke", "yangın", "sel", "heyelan", "fırtına", "sığınak"];
    const candidates = new Set<string>([...hashtagMatches, ...base.filter(w => domain.includes(w))]);
    return Array.from(candidates).slice(0, 5);
  }

  private sentimentToScore(s: Sentiment): number {
    if (s === "positive") return 1;
    if (s === "negative") return -1;
    return 0;
  }

  private filterByTimeframe(list: ParsedTweet[], timeframe?: string, startDateStr?: string, endDateStr?: string): ParsedTweet[] {
    let filtered = list;
    const now = Date.now();

    // Range overrides timeframe if provided
    const startDate = startDateStr ? this.parseDateSafe(String(startDateStr)) : undefined;
    const endDate = endDateStr ? this.parseDateSafe(String(endDateStr)) : undefined;
    if (startDate || endDate) {
      const startMs = startDate ? startDate.getTime() : -Infinity;
      const endMs = endDate ? endDate.getTime() + (24 * 60 * 60 * 1000 - 1) : Infinity; // include end day
      filtered = filtered.filter(t => t.timestamp && t.timestamp.getTime() >= startMs && t.timestamp.getTime() <= endMs);
      return filtered;
    }

    if (!timeframe) return filtered;
    let ms = 0;
    if (timeframe === "7d") ms = 7 * 24 * 60 * 60 * 1000;
    else if (timeframe === "1m") ms = 30 * 24 * 60 * 60 * 1000;
    else if (timeframe === "1y") ms = 365 * 24 * 60 * 60 * 1000;
    if (!ms) return filtered;
    return filtered.filter(t => t.timestamp && now - t.timestamp.getTime() <= ms);
  }

  private normalizeRowKeys(obj: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[this.normalizeKey(k)] = v;
    }
    return out;
  }

  private normalizeKey(key: string): string {
    const map: Record<string, string> = { "ı": "i", "İ": "I", "ş": "s", "Ş": "S", "ğ": "g", "Ğ": "G", "ç": "c", "Ç": "C", "ö": "o", "Ö": "O", "ü": "u", "Ü": "U" };
    let s = String(key || "");
    s = s.replace(/[ıİşŞğĞçÇöÖüÜ]/g, ch => map[ch] || ch);
    s = s.trim().toLowerCase();
    s = s.replace(/\s+/g, "_");
    s = s.replace(/[^a-z0-9_]/g, "");
    return s;
  }

  private coalesce(obj: Record<string, any>, keys: string[]): any {
    for (const k of keys) {
      const nk = this.normalizeKey(k);
      if (obj[nk] !== undefined && obj[nk] !== "") return obj[nk];
    }
    return undefined;
  }
}

export const tweetDataService = new TweetDataService();


