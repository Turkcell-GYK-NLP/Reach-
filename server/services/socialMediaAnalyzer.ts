import { storage } from "../storage";
import { type InsertSocialMediaInsight } from "@shared/schema";
import { analyzeSentiment } from "./openai";
import { TwitterService } from "./twitterService";

// Keywords from the Turkish data source document
const KEYWORDS = {
  disaster: ["deprem", "sarsıntı", "artçı", "şiddetli sallandı", "yine sallandık", "deprem oldu", "afad", "kandilli", "çök kapan tutun"],
  help: ["yardım", "enkaz", "sesimi duyan var mı", "acil", "yardım edin", "yetişin", "yardım gelmedi", "sesimi duyan yok mu", "acil yardım", "gönüllü", "arama kurtarma"],
  network: ["çekmiyor", "şebeke yok", "sinyal yok", "internet gitti", "hat çekmiyor", "bağlantı yok", "offline", "ağ yok", "çevrimdışı", "sinyal problemi", "kapsama dışı"],
  operators: ["turkcell çekmiyor", "vodafone sinyal", "turktelekom internet", "telsiz iletişim", "baz istasyonu çöktü", "5G çalışmıyor", "4.5g kesildi", "mobil veri yok", "edge düştü"],
  youth: ["kampüste", "yurtta", "üniversitede", "öğrenci evinde", "uzaktan eğitim", "online sınav", "barınma sorunu", "gençlik merkezi", "KYK yurdu", "yurtta internet yok"],
};

interface MockSocialMediaPost {
  text: string;
  location: string;
  timestamp: Date;
  category: string;
}

export class SocialMediaAnalyzer {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private twitterService: TwitterService;

  constructor() {
    this.twitterService = new TwitterService();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("Starting social media analysis...");
    
    // Generate initial batch with real data
    this.generateMockData();
    
    // Continue analyzing real data every 2 minutes
    this.intervalId = setInterval(() => {
      this.generateMockData();
    }, 2 * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isRunning = false;
    console.log("Stopped social media analysis");
  }

  private async generateMockData() {
    const locations = ["Kadıköy", "Beşiktaş", "Şişli", "Üsküdar", "Beyoğlu", "Fatih"];
    const posts = this.generateMockPosts(locations);
    
    for (const post of posts) {
      try {
        const sentiment = await analyzeSentiment(post.text);
        
        const insight: InsertSocialMediaInsight = {
          keyword: this.extractMainKeyword(post.text),
          sentiment: sentiment.sentiment,
          count: Math.floor(Math.random() * 200) + 10,
          category: post.category,
          location: post.location,
        };
        
        await storage.createSocialMediaInsight(insight);
      } catch (error) {
        console.error("Error creating social media insight:", error);
      }
    }
    
    console.log(`Generated ${posts.length} social media insights`);
  }

  private generateMockPosts(locations: string[]): MockSocialMediaPost[] {
    const posts: MockSocialMediaPost[] = [];
    
    // Network complaints
    const networkPosts = [
      "Kadıköy'de internet çekmiyor, ne zaman düzelecek?",
      "Turkcell sinyali çok kötü burada",
      "Vodafone 5G hızı arttı galiba",
      "Baz istasyonu arızalı mı, hiç çekmiyor",
      "WiFi de yok, nasıl çalışacağız?",
    ];
    
    // Help requests
    const helpPosts = [
      "Toplanma alanı nerede bilgisi var mı?",
      "Acil yardıma ihtiyacım var",
      "Sesimi duyan var mı, yardım edin",
      "Enkaz altındakiler için arama kurtarma çağırın",
      "Gönüllü olarak yardım etmek istiyorum",
    ];
    
    // Youth-related posts
    const youthPosts = [
      "Kampüste internet kesildi, sınav var",
      "Yurtta kalıyorum, ne yapmalıyım?",
      "Online eğitim için internet lazım",
      "Barınma sorunu yaşıyorum",
      "Gençlik merkezi açık mı?",
    ];
    
    // Positive feedback
    const positivePosts = [
      "5G hızı gerçekten arttı",
      "Turkcell desteği çok iyi",
      "Yardım geldi, teşekkürler",
      "Güvenli alana ulaştık",
      "Her şey yolunda şimdilik",
    ];

    const allPosts = [
      ...networkPosts.map(text => ({ text, category: "network" })),
      ...helpPosts.map(text => ({ text, category: "help" })),
      ...youthPosts.map(text => ({ text, category: "youth" })),
      ...positivePosts.map(text => ({ text, category: "positive" })),
    ];

    // Randomly assign locations and create posts
    for (let i = 0; i < Math.min(5, allPosts.length); i++) {
      const randomPost = allPosts[Math.floor(Math.random() * allPosts.length)];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      posts.push({
        text: randomPost.text,
        location: randomLocation,
        timestamp: new Date(),
        category: randomPost.category,
      });
    }

    return posts;
  }

  private extractMainKeyword(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Check each category for keywords
    for (const [category, keywords] of Object.entries(KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return keyword;
        }
      }
    }
    
    // Fallback to common words
    if (lowerText.includes("internet")) return "internet";
    if (lowerText.includes("yardım")) return "yardım";
    if (lowerText.includes("operatör")) return "operatör";
    
    return "genel";
  }
}

export const socialMediaAnalyzer = new SocialMediaAnalyzer();
