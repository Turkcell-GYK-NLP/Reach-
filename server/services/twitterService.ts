import { TwitterApi } from 'twitter-api-v2';
import { analyzeSentiment } from './openai.js';

export class TwitterService {
  private client: TwitterApi;

  constructor() {
    // X API v2 client with Bearer Token for read operations
    this.client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);
  }

  async searchDisasterTweets(location?: string): Promise<any[]> {
    try {
      // Turkish disaster-related keywords
      const keywords = [
        'deprem', 'earthquake', 'yardım', 'help', 'kurtarma', 'rescue',
        'afet', 'disaster', 'acil', 'emergency', 'şebeke', 'network',
        'türk telekom', 'vodafone', 'turkcell', 'çekmiyor', 'sinyal yok'
      ];

      const locationQuery = location ? ` (${location} OR near:${location})` : '';
      const query = `(${keywords.join(' OR ')}) -is:retweet lang:tr${locationQuery}`;

      const tweets = await this.client.v2.search(query, {
        max_results: 50,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'geo'],
        'user.fields': ['location'],
        expansions: ['author_id']
      });

      const results = [];
      const tweetData = tweets.data?.data || [];
      for (const tweet of tweetData) {
        try {
          // Analyze sentiment with OpenAI
          const sentiment = await analyzeSentiment(tweet.text);
          
          results.push({
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.created_at,
            authorId: tweet.author_id,
            metrics: tweet.public_metrics,
            sentiment: sentiment.sentiment,
            confidence: sentiment.confidence,
            location: tweet.geo?.place_id || null
          });
        } catch (error) {
          console.error('Error analyzing tweet sentiment:', error);
          // Fallback without sentiment analysis
          results.push({
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.created_at,
            authorId: tweet.author_id,
            metrics: tweet.public_metrics,
            sentiment: 'neutral',
            confidence: 0.5,
            location: tweet.geo?.place_id || null
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Twitter API error:', error);
      return [];
    }
  }

  async searchNetworkIssues(operator: string, location?: string): Promise<any[]> {
    try {
      const operatorKeywords = {
        'türk telekom': ['türk telekom', 'tt', 'telekom'],
        'vodafone': ['vodafone', 'vf'],
        'turkcell': ['turkcell', 'tcell']
      };

      const keywords = operatorKeywords[operator.toLowerCase() as keyof typeof operatorKeywords] || [operator];
      const networkTerms = ['çekmiyor', 'sinyal yok', 'bağlantı kesildi', 'internet yok', 'arıza'];
      
      const locationQuery = location ? ` (${location} OR near:${location})` : '';
      const query = `(${keywords.join(' OR ')}) (${networkTerms.join(' OR ')}) -is:retweet lang:tr${locationQuery}`;

      const tweets = await this.client.v2.search(query, {
        max_results: 30,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'geo'],
        'user.fields': ['location'],
        expansions: ['author_id']
      });

      const results = [];
      const tweetData = tweets.data?.data || [];
      for (const tweet of tweetData) {
        try {
          const sentiment = await analyzeSentiment(tweet.text);
          
          results.push({
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.created_at,
            operator,
            sentiment: sentiment.sentiment,
            confidence: sentiment.confidence,
            location: location || 'unknown'
          });
        } catch (error) {
          console.error('Error analyzing network tweet:', error);
          results.push({
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.created_at,
            operator,
            sentiment: 'negative', // Assume negative for network issues
            confidence: 0.7,
            location: location || 'unknown'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Network tweets search error:', error);
      return [];
    }
  }

  async getHelpRequests(location?: string): Promise<any[]> {
    try {
      const helpKeywords = [
        'yardım', 'help', 'kurtarın', 'sıkıştım', 'mahsur kaldım',
        'acil yardım', 'emergency', 'kurtarma', 'rescue'
      ];

      const locationQuery = location ? ` (${location} OR near:${location})` : '';
      const query = `(${helpKeywords.join(' OR ')}) -is:retweet lang:tr${locationQuery}`;

      const tweets = await this.client.v2.search(query, {
        max_results: 40,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'geo'],
        'user.fields': ['location'],
        expansions: ['author_id']
      });

      const results = [];
      const tweetData = tweets.data?.data || [];
      for (const tweet of tweetData) {
        results.push({
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          authorId: tweet.author_id,
          location: tweet.geo?.place_id || location || 'unknown',
          isUrgent: this.isUrgentRequest(tweet.text)
        });
      }

      return results;
    } catch (error) {
      console.error('Help requests search error:', error);
      return [];
    }
  }

  private isUrgentRequest(text: string): boolean {
    const urgentKeywords = [
      'acil', 'emergency', 'hemen', 'immediately', 'sıkıştım',
      'mahsur', 'trapped', 'kurtarın', 'rescue', 'can kaybı'
    ];
    
    return urgentKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}