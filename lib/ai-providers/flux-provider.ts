import Replicate from 'replicate';
import { BaseAIProvider, AIGenerationRequest, AIGenerationResponse, AIProviderConfig, AIProviderError } from './base-provider';

export class FluxProvider extends BaseAIProvider {
  private replicate: Replicate;
  private readonly modelName = 'black-forest-labs/flux-schnell';

  constructor() {
    const config: AIProviderConfig = {
      tier: {
        name: 'free',
        displayName: 'Free Tier (FLUX Schnell)',
        costPerImage: 0.003, // $0.003 per image
        estimatedSpeedSeconds: 15, // Fast generation for onboarding
        priority: 1, // Highest priority for free tier
        enabled: true,
        description: 'Fast FLUX.1 [schnell] model optimized for quick results'
      },
      maxRetries: 3,
      timeoutMs: 120000, // 2 minutes timeout
      rateLimitPerMinute: 10
    };

    super(config);

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN environment variable is required for FluxProvider');
    }

    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  get providerName(): string {
    return 'flux-schnell';
  }

  get supportedStyles(): string[] {
    return ['ghibli', 'dragonball', 'pixel', 'oil', 'cartoon'];
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test API connection by getting model info
      await this.replicate.models.get('black-forest-labs', 'flux-schnell');
      return true;
    } catch (error) {
      console.warn('FluxProvider availability check failed:', error);
      return false;
    }
  }

  async generateImage(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      console.log(`🎨 Starting FLUX generation for session ${request.sessionId}, style: ${request.style}`);

      if (!this.isSupported(request)) {
        throw new AIProviderError(
          `Style '${request.style}' is not supported by ${this.providerName}`,
          this.providerName,
          'UNSUPPORTED_STYLE'
        );
      }

      const prompt = this.buildPrompt(request.style, request.customPrompt);
      
      console.log(`📝 FLUX prompt: ${prompt}`);

      const prediction = await this.withTimeout(
        this.withRetry(() => this.runFluxGeneration(request.inputImageUrl, prompt)),
        this.config.timeoutMs
      );

      const processingTime = Date.now() - startTime;

      console.log(`✅ FLUX generation completed in ${processingTime}ms for session ${request.sessionId}`);

      return {
        success: true,
        generatedImageUrl: prediction.output as string,
        provider: this.providerName,
        model: this.modelName,
        cost: this.config.tier.costPerImage,
        processingTimeMs: processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error(`❌ FLUX generation failed for session ${request.sessionId}:`, error);

      if (error instanceof AIProviderError) {
        return {
          success: false,
          error: error.message,
          provider: this.providerName,
          model: this.modelName,
          cost: 0, // No cost on failure
          processingTimeMs: processingTime
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown generation error',
        provider: this.providerName,
        model: this.modelName,
        cost: 0,
        processingTimeMs: processingTime
      };
    }
  }

  private async runFluxGeneration(inputImageUrl: string, prompt: string): Promise<any> {
    try {
      // Create prediction using FLUX.1 [schnell] model for image-to-image
      const prediction = await this.replicate.run(
        "black-forest-labs/flux-schnell" as any,
        {
          input: {
            image: inputImageUrl,
            prompt: prompt,
            go_fast: true, // Use schnell mode for faster generation
            megapixels: "1", // 1 megapixel for faster processing
            num_outputs: 1,
            aspect_ratio: "1:1", // Square output for consistency
            output_format: "png",
            output_quality: 90,
            num_inference_steps: 4, // Schnell optimized step count
            guidance_scale: 3.5, // Good balance for style transfer
            strength: 0.8, // Strong transformation while keeping structure
          }
        }
      );

      // Handle different response formats
      if (Array.isArray(prediction) && prediction.length > 0) {
        return { output: prediction[0] };
      } else if (typeof prediction === 'string') {
        return { output: prediction };
      } else if (prediction && typeof prediction === 'object') {
        return prediction;
      } else {
        throw new AIProviderError(
          'Invalid response format from FLUX model',
          this.providerName,
          'INVALID_RESPONSE'
        );
      }

    } catch (error: any) {
      // Handle specific Replicate API errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.detail || error.message;
        
        if (status === 401) {
          throw new AIProviderError(
            'Invalid Replicate API token',
            this.providerName,
            'AUTH_ERROR',
            status
          );
        } else if (status === 402) {
          throw new AIProviderError(
            'Insufficient credits in Replicate account',
            this.providerName,
            'INSUFFICIENT_CREDITS',
            status
          );
        } else if (status === 429) {
          throw new AIProviderError(
            'Rate limit exceeded for Replicate API',
            this.providerName,
            'RATE_LIMITED',
            status
          );
        } else if (status >= 500) {
          throw new AIProviderError(
            'Replicate service temporarily unavailable',
            this.providerName,
            'SERVICE_ERROR',
            status
          );
        }
        
        throw new AIProviderError(
          `Replicate API error: ${message}`,
          this.providerName,
          'API_ERROR',
          status
        );
      }

      // Handle network and other errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new AIProviderError(
          'Unable to connect to Replicate API',
          this.providerName,
          'NETWORK_ERROR'
        );
      }

      // Re-throw AIProviderErrors as-is
      if (error instanceof AIProviderError) {
        throw error;
      }

      // Handle unknown errors
      throw new AIProviderError(
        `Unexpected error: ${error.message || 'Unknown error'}`,
        this.providerName,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Enhanced prompt building for FLUX model
   */
  protected buildPrompt(style: string, customPrompt?: string): string {
    // FLUX-optimized style prompts with better descriptors
    const fluxStylePrompts: Record<string, string> = {
      'ghibli': 'Studio Ghibli anime style, hand-drawn animation, soft watercolor palette, dreamy atmosphere, detailed backgrounds, Hayao Miyazaki inspired',
      'dragonball': 'Dragon Ball anime style, Akira Toriyama art, dynamic action pose, vibrant colors, manga illustration, spiky hair, intense energy aura',
      'pixel': 'pixel art style, 16-bit retro gaming graphics, crisp pixels, limited color palette, arcade game aesthetic, detailed sprite work',
      'oil': 'classical oil painting style, Renaissance technique, rich impasto brushstrokes, warm color palette, painterly texture, fine art masterpiece',
      'cartoon': 'cartoon illustration style, Western animation, bold outlines, bright saturated colors, simplified character design, Disney-Pixar inspired'
    };

    const stylePrompt = fluxStylePrompts[style] || style;
    const baseQuality = 'high quality, detailed, professional, trending on artstation';
    
    if (customPrompt) {
      return `${customPrompt}, ${stylePrompt}, ${baseQuality}`;
    }

    return `Transform into ${stylePrompt}, ${baseQuality}`;
  }

  /**
   * Get FLUX-specific generation statistics
   */
  async getModelStats(): Promise<{
    modelVersion: string;
    averageGenerationTime: number;
    supportedResolutions: string[];
    maxSteps: number;
  }> {
    return {
      modelVersion: 'FLUX.1 [schnell]',
      averageGenerationTime: 15, // seconds
      supportedResolutions: ['512x512', '768x768', '1024x1024'],
      maxSteps: 8 // Schnell is optimized for 1-8 steps
    };
  }
}