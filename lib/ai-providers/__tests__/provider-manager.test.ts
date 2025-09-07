/**
 * Comprehensive tests for AIProviderManager
 * Addresses test coverage concerns from code review
 */

import { AIProviderManager, ProviderSelection, GenerationOptions } from '../provider-manager';
import { BaseAIProvider, AIGenerationRequest, AIGenerationResponse, AIProviderTier } from '../base-provider';
import { validateEnvironment } from '../../config/env-validation';

// Mock providers for testing
class MockProvider extends BaseAIProvider {
  constructor(
    public override providerName: string,
    private shouldFail: boolean = false,
    private responseTime: number = 1000,
    private cost: number = 0.01
  ) {
    super();
  }

  protected getApiKey(): string | undefined {
    return 'mock-api-key';
  }

  getConfig(): any {
    return {
      tier: {
        name: 'test',
        costPerImage: this.cost,
        maxCost: 0.10
      }
    };
  }

  async checkHealth(): Promise<{ isHealthy: boolean; responseTime: number; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, this.responseTime));
    
    if (this.shouldFail) {
      return { isHealthy: false, responseTime: this.responseTime, error: 'Mock failure' };
    }
    
    return { isHealthy: true, responseTime: this.responseTime };
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    if (this.shouldFail) {
      throw new Error('Mock generation failure');
    }

    return {
      success: true,
      imageUrl: 'https://example.com/test-image.jpg',
      cost: this.cost,
      provider: this.providerName,
      processingTime: this.responseTime,
      generationId: 'mock-gen-id'
    };
  }
}

describe('AIProviderManager', () => {
  let manager: AIProviderManager;
  let mockProviders: MockProvider[];

  beforeEach(() => {
    // Setup mock environment
    process.env.NODE_ENV = 'test';
    
    // Create a manager with mock providers
    manager = new AIProviderManager();
    
    // Clear existing providers and add mock ones
    (manager as any).providers = [];
    
    mockProviders = [
      new MockProvider('free-provider', false, 500, 0.003),
      new MockProvider('premium-provider', false, 1000, 0.020),
      new MockProvider('pro-provider', false, 2000, 0.055),
      new MockProvider('failing-provider', true, 1500, 0.030)
    ];
    
    mockProviders.forEach(provider => {
      (manager as any).providers.push(provider);
    });
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.NODE_ENV;
  });

  describe('Provider Selection', () => {
    test('should select cheapest healthy provider by default', async () => {
      const selection = await manager.selectBestProvider({
        prompt: 'test prompt'
      });

      expect(selection).toBeDefined();
      expect(selection.provider.providerName).toBe('free-provider');
      expect(selection.estimatedCost).toBe(0.003);
    });

    test('should respect preferred tier when specified', async () => {
      const selection = await manager.selectBestProvider({
        prompt: 'test prompt'
      }, {
        preferredTier: 'premium'
      });

      expect(selection).toBeDefined();
      expect(selection.provider.providerName).toBe('premium-provider');
      expect(selection.estimatedCost).toBe(0.020);
    });

    test('should respect max cost constraint', async () => {
      const selection = await manager.selectBestProvider({
        prompt: 'test prompt'
      }, {
        maxCost: 0.015
      });

      expect(selection).toBeDefined();
      expect(selection.estimatedCost).toBeLessThanOrEqual(0.015);
      expect(selection.provider.providerName).toBe('free-provider');
    });

    test('should skip unhealthy providers', async () => {
      // Make the free provider fail health check
      mockProviders[0]['shouldFail'] = true;
      
      const selection = await manager.selectBestProvider({
        prompt: 'test prompt'
      });

      expect(selection).toBeDefined();
      expect(selection.provider.providerName).not.toBe('free-provider');
      expect(selection.provider.providerName).toBe('premium-provider');
    });

    test('should throw error when no providers meet criteria', async () => {
      await expect(manager.selectBestProvider({
        prompt: 'test prompt'
      }, {
        maxCost: 0.001 // Too low for any provider
      })).rejects.toThrow('No suitable AI provider found');
    });
  });

  describe('Health Monitoring', () => {
    test('should cache health check results', async () => {
      const provider = mockProviders[0];
      
      // First health check
      const startTime = Date.now();
      const health1 = await manager.getProviderHealth(provider);
      const firstCallTime = Date.now() - startTime;
      
      // Second health check should be much faster (cached)
      const startTime2 = Date.now();
      const health2 = await manager.getProviderHealth(provider);
      const secondCallTime = Date.now() - startTime2;
      
      expect(health1.isHealthy).toBe(true);
      expect(health2.isHealthy).toBe(true);
      expect(secondCallTime).toBeLessThan(firstCallTime);
    });

    test('should refresh expired health cache', async () => {
      const provider = mockProviders[0];
      
      // Set very short cache TTL for testing
      (manager as any).healthCacheTtl = 10; // 10ms
      
      await manager.getProviderHealth(provider);
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const health = await manager.getProviderHealth(provider);
      expect(health.isHealthy).toBe(true);
    });
  });

  describe('Generation Process', () => {
    test('should successfully generate with best provider', async () => {
      const request: AIGenerationRequest = {
        prompt: 'test prompt'
      };

      const result = await manager.generateWithBestProvider(request);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.provider).toBe('free-provider');
      expect(result.cost).toBe(0.003);
    });

    test('should fallback to next best provider on failure', async () => {
      const request: AIGenerationRequest = {
        prompt: 'test prompt'
      };

      // Make the cheapest provider fail
      mockProviders[0]['shouldFail'] = true;

      const result = await manager.generateWithBestProvider(request, {
        fallbackEnabled: true
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('premium-provider'); // Second cheapest
    });

    test('should throw error when all providers fail and fallback disabled', async () => {
      const request: AIGenerationRequest = {
        prompt: 'test prompt'
      };

      // Make all providers fail
      mockProviders.forEach(provider => provider['shouldFail'] = true);

      await expect(manager.generateWithBestProvider(request, {
        fallbackEnabled: false
      })).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle provider initialization errors gracefully', () => {
      // Mock environment validation to fail
      const originalValidation = validateEnvironment;
      
      jest.spyOn(require('../../config/env-validation'), 'validateEnvironment')
        .mockReturnValue({
          isValid: false,
          errors: ['Test environment error'],
          warnings: []
        });

      expect(() => new AIProviderManager()).toThrow('Environment validation failed');
      
      // Restore original function
      jest.restoreAllMocks();
    });

    test('should handle network timeout errors', async () => {
      const slowProvider = new MockProvider('slow-provider', false, 10000, 0.01);
      (manager as any).providers = [slowProvider];
      
      const request: AIGenerationRequest = {
        prompt: 'test prompt'
      };

      // This should timeout or handle long response times gracefully
      const startTime = Date.now();
      try {
        await manager.generateWithBestProvider(request);
      } catch (error) {
        // Expected to fail or handle timeout
      }
      const endTime = Date.now();
      
      // Should not take longer than reasonable timeout
      expect(endTime - startTime).toBeLessThan(15000);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate provider configurations', () => {
      const providers = manager.getAvailableProviders();
      
      expect(providers.length).toBeGreaterThan(0);
      
      providers.forEach(provider => {
        const config = provider.getConfig();
        expect(config).toBeDefined();
        expect(config.tier).toBeDefined();
        expect(config.tier.name).toBeDefined();
        expect(config.tier.costPerImage).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

// Additional tests for edge cases and performance
describe('AIProviderManager - Edge Cases', () => {
  test('should handle empty prompt gracefully', async () => {
    const manager = new AIProviderManager();
    
    await expect(manager.selectBestProvider({
      prompt: ''
    })).rejects.toThrow();
  });

  test('should handle concurrent requests efficiently', async () => {
    const manager = new AIProviderManager();
    (manager as any).providers = [new MockProvider('test-provider', false, 100, 0.01)];
    
    const requests = Array.from({ length: 5 }, (_, i) => ({
      prompt: `test prompt ${i}`
    }));

    const startTime = Date.now();
    const results = await Promise.all(
      requests.map(req => manager.selectBestProvider(req))
    );
    const endTime = Date.now();

    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.provider).toBeDefined();
    });

    // Should handle concurrent requests efficiently
    expect(endTime - startTime).toBeLessThan(1000);
  });
});