/**
 * Test utility to verify AI provider setup
 * This file helps debug and test the AI generation system
 */

import { aiProviderManager } from './provider-manager';

export async function testAISetup() {
  console.log('🧪 Testing AI Provider Setup...');
  
  try {
    // Test system status
    const systemStatus = await aiProviderManager.getSystemStatus();
    console.log('📊 System Status:', {
      totalProviders: systemStatus.totalProviders,
      healthyProviders: systemStatus.healthyProviders,
      availableStyles: systemStatus.availableStyles,
    });

    if (systemStatus.healthyProviders === 0) {
      console.error('❌ No healthy providers available!');
      return false;
    }

    // Test provider selection
    const testRequest = {
      inputImageUrl: 'https://example.com/test.jpg',
      style: 'ghibli',
      sessionId: 'test-session'
    };

    const selection = await aiProviderManager.selectProvider(testRequest);
    console.log('🎯 Provider Selection:', {
      provider: selection.provider.providerName,
      estimatedCost: selection.estimatedCost,
      estimatedTime: selection.estimatedTime,
      reason: selection.reason
    });

    // Test cost estimation
    const costEstimate = await aiProviderManager.estimateCost(testRequest);
    console.log('💰 Cost Estimate:', costEstimate);

    console.log('✅ AI Provider setup test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ AI Provider setup test failed:', error);
    return false;
  }
}

export function checkEnvironmentSetup() {
  console.log('🔍 Checking Environment Setup...');
  
  const required = [
    'REPLICATE_API_TOKEN',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'CLOUDFLARE_R2_ACCOUNT_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

// Helper function to test a specific generation request (for debugging)
export async function testGeneration(params: {
  inputImageUrl: string;
  style: string;
  sessionId: string;
  customPrompt?: string;
}) {
  console.log('🎨 Testing AI Generation...');
  console.log('📋 Parameters:', params);
  
  try {
    const result = await aiProviderManager.generateImage(params);
    console.log('🎉 Generation Result:', {
      success: result.success,
      provider: result.provider,
      model: result.model,
      cost: result.cost,
      processingTime: result.processingTimeMs,
      hasImage: !!result.generatedImageUrl,
      error: result.error
    });
    
    return result;
  } catch (error) {
    console.error('❌ Generation test failed:', error);
    throw error;
  }
}