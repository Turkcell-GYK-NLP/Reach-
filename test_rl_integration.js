// RL Integration Test Script
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testRLIntegration() {
  console.log('🧪 Testing RL Recommendation Engine Integration...\n');

  try {
    // Test 1: Basic chat with RL recommendations
    console.log('1️⃣ Testing basic chat with RL recommendations...');
    const chatResponse = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user-rl',
        message: 'Kadıköy\'de güvenli alanlar nerede?',
        userContext: {
          location: { district: 'Kadıköy', city: 'İstanbul' },
          operator: 'Turkcell',
          age: 25
        }
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat response received');
      
      // Check if RL recommendation is present
      const hasRecommendation = chatData.agentResponse?.toolResults?.some(
        result => result.type === 'recommendation'
      );
      
      if (hasRecommendation) {
        console.log('✅ RL recommendation found in response');
        const recommendation = chatData.agentResponse.toolResults.find(
          result => result.type === 'recommendation'
        );
        console.log('📊 Recommendation:', {
          type: recommendation.data.type,
          title: recommendation.data.title,
          confidence: recommendation.data.confidence
        });
      } else {
        console.log('⚠️ No RL recommendation found');
      }
    } else {
      console.log('❌ Chat request failed:', await chatResponse.text());
    }

    console.log('\n2️⃣ Testing RL feedback system...');
    
    // Test 2: Send feedback
    const feedbackResponse = await fetch(`${API_BASE}/recommendation/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user-rl',
        actionId: 'safe_area_Kadıköy',
        reward: 0.8,
        userContext: {
          location: { district: 'Kadıköy', city: 'İstanbul' },
          operator: 'Turkcell',
          age: 25
        }
      })
    });

    if (feedbackResponse.ok) {
      const feedbackData = await feedbackResponse.json();
      console.log('✅ Feedback recorded:', feedbackData.message);
    } else {
      console.log('❌ Feedback request failed:', await feedbackResponse.text());
    }

    console.log('\n3️⃣ Testing RL performance metrics...');
    
    // Test 3: Get performance metrics
    const performanceResponse = await fetch(`${API_BASE}/recommendation/performance`);
    
    if (performanceResponse.ok) {
      const performanceData = await performanceResponse.json();
      console.log('✅ Performance metrics:', performanceData);
    } else {
      console.log('❌ Performance request failed:', await performanceResponse.text());
    }

    console.log('\n4️⃣ Testing different query types...');
    
    // Test 4: Different query types
    const testQueries = [
      'Şebeke durumu nasıl?',
      'Acil durumda ne yapmalıyım?',
      'Bildirim ayarlarını nasıl yapabilirim?',
      'acil yardım lazım bana',  // Critical emergency
      'korkuyorum',  // High emergency
      'sorun var',  // Medium emergency
      'selam',  // Low emergency
      'Kadıköy\'de güvenli alanlar nerede?'  // Location query
    ];

    for (const query of testQueries) {
      console.log(`\n🔍 Testing: "${query}"`);
      
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-rl',
          message: query,
          userContext: {
            location: { district: 'Beşiktaş', city: 'İstanbul' },
            operator: 'Vodafone',
            age: 30
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const hasRecommendation = data.agentResponse?.toolResults?.some(
          result => result.type === 'recommendation'
        );
        console.log(hasRecommendation ? '✅ RL recommendation generated' : '⚠️ No RL recommendation');
      }
    }

    console.log('\n🎉 RL Integration Test Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRLIntegration();
