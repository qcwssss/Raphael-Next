import {
  BaseAIProvider,
  AIGenerationRequest,
  AIGenerationResponse,
  AIProviderConfig
} from './base-provider';
import { CloudflareR2Storage } from '../storage/cloudflare-r2';

export class PollinationsProvider extends BaseAIProvider {
  private apiKey: string;
  private baseUrl = 'https://image.pollinations.ai/prompt';
  private storage: CloudflareR2Storage;

  constructor() {
    const config: AIProviderConfig = {
      tier: {
        name: 'free',
        displayName: 'Image-to-Image (Pollinations.ai)',
        costPerImage: 0, // May require Seed tier or higher
        estimatedSpeedSeconds: 10, // Very fast generation
        priority: 0, // Highest priority (lower number = higher priority)
        enabled: true,
        description: 'Image-to-image transformation via Pollinations.ai Kontext model - may require Seed tier'
      },
      maxRetries: 3,
      timeoutMs: 60000, // 1 minute timeout
      rateLimitPerMinute: 60 // Conservative estimate
    };

    super(config);
    this.apiKey = process.env.POLLINATIONS_API_KEY || '';
    this.storage = new CloudflareR2Storage();
  }

  get providerName(): string {
    return 'pollinations';
  }

  get supportedStyles(): string[] {
    return ['ghibli', 'dragonball', 'pixel', 'oil', 'cartoon'];
  }

  async generateImage(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      console.log(`🌸 Starting Pollinations img2img generation with style: ${request.style}`);
      
      const prompt = this.buildPrompt(request.style, request.customPrompt);
      const enhancedPrompt = this.enhancePrompt(prompt);
      
      console.log(`📤 Transforming image with Pollinations: ${enhancedPrompt.substring(0, 100)}...`);
      console.log(`📥 Input image URL: ${request.inputImageUrl}`);

      // Test if input image URL is accessible
      try {
        console.log(`🔍 Testing input image accessibility...`);
        const testResponse = await fetch(request.inputImageUrl, { method: 'HEAD' });
        console.log(`📊 Input image test result: ${testResponse.status} ${testResponse.statusText}`);
        console.log(`📋 Input image content-type: ${testResponse.headers.get('content-type')}`);
      } catch (error) {
        console.warn(`⚠️ Cannot access input image URL:`, error);
      }

      // Build URL with image parameter for image-to-image transformation using Kontext model
      const params = new URLSearchParams({
        width: '1024',
        height: '1024',
        model: 'kontext', // Kontext model for image-to-image transformation
        image: request.inputImageUrl // Input image URL for transformation
      });
      
      const imageUrl = `${this.baseUrl}/${encodeURIComponent(enhancedPrompt)}?${params.toString()}`;
      
      console.log(`🔗 Full Pollinations URL: ${imageUrl}`);
      console.log(`🎯 Parameters sent:`, {
        prompt: enhancedPrompt,
        width: '1024',
        height: '1024',
        model: 'kontext',
        inputImageUrl: request.inputImageUrl
      });
      
      // Log the raw parameters for debugging
      console.log(`🔧 Raw URLSearchParams:`, params.toString());
      
      const headers: Record<string, string> = {
        'User-Agent': 'RaphaelNext/1.0',
      };
      
      // Add API key if available
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        console.log(`🔑 Using API key: [REDACTED]`);
      } else {
        console.log(`⚠️ No API key found - using anonymous access`);
      }

      console.log(`🌐 Making request to: ${imageUrl}`);

      const response = await fetch(imageUrl, {
        method: 'GET',
        headers,
      });

      console.log(`📊 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.error(`❌ Pollinations API error (${response.status}): ${response.statusText}`);
        return {
          success: false,
          error: `Pollinations API error: ${response.status} ${response.statusText}`,
          provider: this.providerName,
          model: 'flux',
          processingTimeMs: Date.now() - startTime,
          cost: 0,
        };
      }

      // Get image as buffer
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      if (imageBuffer.length === 0) {
        return {
          success: false,
          error: 'Generated image is empty',
          provider: this.providerName,
          model: 'flux',
          processingTimeMs: Date.now() - startTime,
          cost: 0,
        };
      }

      // Store the generated image in R2
      const sessionId = request.sessionId || `pollinations-${Date.now()}`;
      const fileName = 'generated.jpg';
      
      console.log(`💾 Storing generated image in R2...`);
      
      const fileKey = await this.storage.uploadFile(
        sessionId,
        fileName,
        imageBuffer,
        'image/jpeg'
      );

      const generatedImageUrl = await this.storage.getFileUrl(fileKey);

      console.log(`✅ Pollinations generation complete: ${generatedImageUrl}`);

      return {
        success: true,
        generatedImageUrl,
        provider: this.providerName,
        model: 'kontext',
        processingTimeMs: Date.now() - startTime,
        cost: 0, // Free!
      };

    } catch (error) {
      console.error('❌ Pollinations generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.providerName,
        model: 'kontext',
        processingTimeMs: Date.now() - startTime,
        cost: 0,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test the service with a simple request using kontext model
      const testUrl = `${this.baseUrl}/test?width=64&height=64&model=kontext`;
      
      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        timeout: 10000, // 10 second timeout for health check
      });

      const available = response.ok;
      console.log(`🔍 Pollinations provider health check: ${available ? 'healthy' : 'unhealthy'} (status: ${response.status})`);
      return available;

    } catch (error) {
      console.log('❌ Pollinations provider health check failed:', error);
      return false;
    }
  }

  /**
   * Enhance prompt for better results with Stable Diffusion models
   */
  private enhancePrompt(basePrompt: string): string {
    // Add quality enhancers for Stable Diffusion
    const qualityEnhancers = [
      'high quality',
      'detailed',
      '8k resolution',
      'professional',
      'masterpiece'
    ];

    // Avoid negative aspects
    const negativePrompt = 'low quality, blurry, distorted, ugly, deformed';
    
    return `${basePrompt}, ${qualityEnhancers.join(', ')}, NOT ${negativePrompt}`;
  }
}