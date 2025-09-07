/**
 * Tests for PollinationsProvider
 * Tests the free AI provider integration
 */

import { PollinationsProvider } from '../pollinations-provider';
import { AIGenerationRequest } from '../base-provider';

// Mock fetch for testing
global.fetch = jest.fn();

describe('PollinationsProvider', () => {
  let provider: PollinationsProvider;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    provider = new PollinationsProvider();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Configuration', () => {
    test('should have correct provider configuration', () => {
      const config = provider.getConfig();
      
      expect(config).toBeDefined();
      expect(config.tier.name).toBe('free');
      expect(config.tier.costPerImage).toBe(0);
      expect(provider.providerName).toBe('pollinations');
    });

    test('should not require API key', () => {
      const apiKey = (provider as any).getApiKey();
      expect(apiKey).toBeUndefined();
    });
  });

  describe('Health Checks', () => {
    test('should return healthy status when API is accessible', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      const health = await provider.checkHealth();

      expect(health.isHealthy).toBe(true);
      expect(health.responseTime).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pollinations.ai'),
        expect.objectContaining({
          method: 'HEAD',
          timeout: expect.any(Number)
        })
      );
    });

    test('should return unhealthy status when API is not accessible', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const health = await provider.checkHealth();

      expect(health.isHealthy).toBe(false);
      expect(health.error).toContain('Network error');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const health = await provider.checkHealth();

      expect(health.isHealthy).toBe(false);
      expect(health.error).toContain('timeout');
    });
  });

  describe('Image Generation', () => {
    test('should generate image successfully with basic prompt', async () => {
      const mockImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockImageBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' })
      } as Response);

      const request: AIGenerationRequest = {
        prompt: 'a beautiful sunset'
      };

      const result = await provider.generate(request);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.cost).toBe(0);
      expect(result.provider).toBe('pollinations');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pollinations.ai'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    test('should handle prompt enhancement', async () => {
      const mockImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockImageBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' })
      } as Response);

      const request: AIGenerationRequest = {
        prompt: 'cat'
      };

      await provider.generate(request);

      // Should enhance short prompts
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/high.quality.*detailed/i),
        expect.any(Object)
      );
    });

    test('should handle image-to-image generation', async () => {
      const mockImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockImageBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' })
      } as Response);

      const request: AIGenerationRequest = {
        prompt: 'transform this image',
        inputImageUrl: 'https://example.com/input.jpg'
      };

      const result = await provider.generate(request);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('input=https://example.com/input.jpg'),
        expect.any(Object)
      );
    });

    test('should handle generation failures gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const request: AIGenerationRequest = {
        prompt: 'test prompt'
      };

      const result = await provider.generate(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
      expect(result.cost).toBe(0);
    });

    test('should handle network errors during generation', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request: AIGenerationRequest = {
        prompt: 'test prompt'
      };

      const result = await provider.generate(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should apply proper URL encoding to prompts', async () => {
      const mockImageBlob = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockImageBlob),
        headers: new Headers({ 'content-type': 'image/jpeg' })
      } as Response);

      const request: AIGenerationRequest = {
        prompt: 'a cat & dog playing together!'
      };

      await provider.generate(request);

      // Should properly encode special characters
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('&'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('!'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    test('should retry on temporary failures', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['fake-image-data'], { type: 'image/jpeg' })),
          headers: new Headers({ 'content-type': 'image/jpeg' })
        } as Response);

      const request: AIGenerationRequest = {
        prompt: 'test prompt'
      };

      const result = await provider.generate(request);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should limit retry attempts', async () => {
      // All calls fail
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      const request: AIGenerationRequest = {
        prompt: 'test prompt'
      };

      const result = await provider.generate(request);

      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Input Validation', () => {
    test('should reject empty prompts', async () => {
      const request: AIGenerationRequest = {
        prompt: ''
      };

      await expect(provider.generate(request)).rejects.toThrow('Prompt cannot be empty');
    });

    test('should reject extremely long prompts', async () => {
      const request: AIGenerationRequest = {
        prompt: 'a'.repeat(2000) // Very long prompt
      };

      await expect(provider.generate(request)).rejects.toThrow('Prompt too long');
    });

    test('should validate input image URLs', async () => {
      const request: AIGenerationRequest = {
        prompt: 'test prompt',
        inputImageUrl: 'invalid-url'
      };

      await expect(provider.generate(request)).rejects.toThrow('Invalid input image URL');
    });
  });
});