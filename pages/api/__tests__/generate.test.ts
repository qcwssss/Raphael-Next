/**
 * Integration tests for /api/generate endpoint
 * Tests the main API that handles AI image generation requests
 */

import { createMocks } from 'node-mocks-http';
import handler from '../generate';
import { AIProviderManager } from '../../../lib/ai-providers/provider-manager';

// Mock the AI provider manager
jest.mock('../../../lib/ai-providers/provider-manager');
const MockAIProviderManager = AIProviderManager as jest.MockedClass<typeof AIProviderManager>;

// Mock multer middleware
jest.mock('multer', () => {
  return jest.fn(() => ({
    single: jest.fn(() => (req: any, res: any, next: any) => {
      // Mock file upload
      if (req.method === 'POST') {
        req.file = {
          buffer: Buffer.from('fake-image-data'),
          mimetype: 'image/jpeg',
          originalname: 'test.jpg',
          size: 1024
        };
      }
      next();
    })
  }));
});

describe('/api/generate', () => {
  let mockProviderManager: jest.Mocked<AIProviderManager>;

  beforeEach(() => {
    mockProviderManager = {
      generateWithBestProvider: jest.fn(),
      selectBestProvider: jest.fn(),
      getProviderStatus: jest.fn(),
      getAvailableProviders: jest.fn()
    } as any;

    MockAIProviderManager.mockImplementation(() => mockProviderManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/generate', () => {
    test('should generate image successfully with text prompt', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'a beautiful sunset over mountains',
          style: 'realistic'
        }
      });

      mockProviderManager.generateWithBestProvider.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated-image.jpg',
        cost: 0.003,
        provider: 'pollinations',
        processingTime: 2500,
        generationId: 'gen-123'
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.imageUrl).toBe('https://example.com/generated-image.jpg');
      expect(data.data.provider).toBe('pollinations');
      expect(data.data.cost).toBe(0.003);
    });

    test('should handle image-to-image generation with file upload', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'transform this image to watercolor style',
          style: 'watercolor'
        }
      });

      // Mock file is added by multer mock above
      mockProviderManager.generateWithBestProvider.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated-image.jpg',
        cost: 0.020,
        provider: 'flux-dev',
        processingTime: 4500,
        generationId: 'gen-456'
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(mockProviderManager.generateWithBestProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          inputImageUrl: expect.stringContaining('sessions/')
        })
      );
    });

    test('should validate required prompt parameter', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          style: 'realistic'
          // Missing prompt
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain('Prompt is required');
    });

    test('should validate prompt length', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'a'.repeat(2000), // Too long
          style: 'realistic'
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain('too long');
    });

    test('should validate file upload size and type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'test prompt',
          style: 'realistic'
        }
      });

      // Override mock to simulate large file
      req.file = {
        buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB
        mimetype: 'image/jpeg',
        originalname: 'large.jpg',
        size: 10 * 1024 * 1024
      };

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain('File too large');
    });

    test('should validate file type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'test prompt',
          style: 'realistic'
        }
      });

      // Override mock to simulate invalid file type
      req.file = {
        buffer: Buffer.from('fake-data'),
        mimetype: 'application/pdf',
        originalname: 'document.pdf',
        size: 1024
      };

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid file type');
    });

    test('should handle AI provider errors gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'test prompt',
          style: 'realistic'
        }
      });

      mockProviderManager.generateWithBestProvider.mockRejectedValue(
        new Error('No healthy providers available')
      );

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain('Generation failed');
    });

    test('should handle rate limiting', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'test-client'
        },
        body: {
          prompt: 'test prompt',
          style: 'realistic'
        }
      });

      // Simulate rate limit exceeded
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).statusCode = 429;
      mockProviderManager.generateWithBestProvider.mockRejectedValue(rateLimitError);

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(429);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error).toContain('Rate limit exceeded');
    });

    test('should sanitize prompts for security', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: '<script>alert("xss")</script>malicious prompt',
          style: 'realistic'
        }
      });

      mockProviderManager.generateWithBestProvider.mockResolvedValue({
        success: true,
        imageUrl: 'https://example.com/generated-image.jpg',
        cost: 0.003,
        provider: 'pollinations',
        processingTime: 2500,
        generationId: 'gen-789'
      });

      await handler(req as any, res as any);

      expect(mockProviderManager.generateWithBestProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.not.stringContaining('<script>')
        })
      );
    });

    test('should include generation metadata in response', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'test prompt',
          style: 'realistic'
        }
      });

      const mockResponse = {
        success: true,
        imageUrl: 'https://example.com/generated-image.jpg',
        cost: 0.020,
        provider: 'flux-dev',
        processingTime: 3500,
        generationId: 'gen-metadata-test'
      };

      mockProviderManager.generateWithBestProvider.mockResolvedValue(mockResponse);

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data).toMatchObject({
        imageUrl: mockResponse.imageUrl,
        provider: mockResponse.provider,
        cost: mockResponse.cost,
        processingTime: mockResponse.processingTime,
        generationId: mockResponse.generationId
      });
    });
  });

  describe('GET /api/generate/status', () => {
    test('should return provider status information', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { action: 'status' }
      });

      mockProviderManager.getProviderStatus.mockResolvedValue({
        providers: [
          {
            name: 'pollinations',
            healthy: true,
            tier: 'free',
            cost: 0,
            responseTime: 500
          },
          {
            name: 'flux-dev',
            healthy: true,
            tier: 'standard',
            cost: 0.030,
            responseTime: 1200
          }
        ],
        totalProviders: 2,
        healthyProviders: 2
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.providers).toHaveLength(2);
      expect(data.healthyProviders).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE'
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('Method not allowed');
    });

    test('should handle malformed JSON in request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        }
      });

      // Simulate malformed JSON by setting invalid body
      (req as any).body = undefined;
      (req as any).rawBody = 'invalid-json{';

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
    });

    test('should mask sensitive information in error responses', async () => {
      process.env.NODE_ENV = 'production';

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          prompt: 'test prompt',
          style: 'realistic'
        }
      });

      const sensitiveError = new Error('Database connection failed: postgresql://user:password@host/db');
      mockProviderManager.generateWithBestProvider.mockRejectedValue(sensitiveError);

      await handler(req as any, res as any);

      const data = JSON.parse(res._getData());
      expect(data.error).not.toContain('password');
      expect(data.error).not.toContain('postgresql://');

      // Cleanup
      delete process.env.NODE_ENV;
    });
  });
});