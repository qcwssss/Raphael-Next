import {
  BaseAIProvider,
  AIGenerationRequest,
  AIGenerationResponse,
  AIProviderTier,
  AIProviderConfig
} from './base-provider';
import { CloudflareR2Storage } from '../storage/cloudflare-r2';
import { AI_CONFIG } from '../config/constants';

interface BFLGenerationRequest {
  prompt: string;
  width: number;
  height: number;
  prompt_upsampling?: boolean;
  seed?: number;
  safety_tolerance?: number;
  output_format?: 'jpeg' | 'png';
}

interface BFLGenerationResponse {
  id: string;
  result?: {
    sample: string; // Base64 encoded image
  };
  status: 'Request Pending' | 'Request Moderated' | 'Content Moderated' | 'Ready';
  error?: string;
}

export class BFLProvider extends BaseAIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.bfl.ai/v1';
  private storage: CloudflareR2Storage;

  constructor() {
    const config: AIProviderConfig = {
      tier: {
        name: 'free',
        displayName: 'Free Tier (FLUX Schnell - Direct BFL)',
        costPerImage: 0.003, // $0.003 per image
        estimatedSpeedSeconds: 20, // FLUX Schnell is fast
        priority: 0, // Highest priority (lower number = higher priority)
        enabled: true,
        description: 'Direct Black Forest Labs FLUX.1 [schnell] - fastest generation'
      },
      maxRetries: AI_CONFIG.DEFAULT_MAX_RETRIES,
      timeoutMs: AI_CONFIG.BFL_PROVIDER_TIMEOUT_MS,
      rateLimitPerMinute: 10
    };

    super(config);
    this.apiKey = process.env.BFL_API_KEY || process.env.BLACK_FOREST_LABS_API_KEY || '';
    this.storage = new CloudflareR2Storage();
  }

  get providerName(): string {
    return 'bfl-flux-schnell';
  }

  get supportedStyles(): string[] {
    return ['ghibli', 'dragonball', 'pixel', 'oil', 'cartoon'];
  }

  async generateImage(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      return {
        success: false,
        error: 'BFL API key not configured',
        provider: this.providerName,
        model: 'flux-schnell',
        processingTimeMs: Date.now() - startTime,
        cost: 0,
      };
    }

    try {
      console.log(`🎨 Starting BFL generation with style: ${request.style}`);
      
      const prompt = this.buildPrompt(request.style, request.customPrompt);
      
      // Submit generation request
      const requestPayload: BFLGenerationRequest = {
        prompt,
        width: AI_CONFIG.DEFAULT_IMAGE_WIDTH,
        height: AI_CONFIG.DEFAULT_IMAGE_HEIGHT,
        prompt_upsampling: false,
        output_format: 'jpeg',
      };

      console.log(`📤 Submitting to BFL API: ${prompt.substring(0, 100)}...`);

      const response = await fetch(`${this.baseUrl}/flux-schnell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-key': this.apiKey,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ BFL API error (${response.status}):`, errorText);
        return {
          success: false,
          error: `BFL API error: ${response.status} ${errorText}`,
          provider: this.providerName,
          model: 'flux-schnell',
          processingTimeMs: Date.now() - startTime,
          cost: 0,
        };
      }

      const submissionResult = await response.json();
      console.log(`📋 BFL generation submitted with ID: ${submissionResult.id}`);

      // Poll for results
      const result = await this.pollForResult(submissionResult.id, startTime);
      
      if (!result.success || !result.imageBuffer) {
        return result;
      }

      // Store the generated image in R2
      const sessionId = `bfl-${Date.now()}`;
      const fileName = 'generated.jpg';
      
      console.log(`💾 Storing generated image in R2...`);
      
      const fileKey = await this.storage.uploadFile(
        sessionId,
        fileName,
        result.imageBuffer,
        'image/jpeg'
      );

      const imageUrl = await this.storage.getFileUrl(fileKey);

      console.log(`✅ BFL generation complete: ${imageUrl}`);

      return {
        success: true,
        generatedImageUrl: imageUrl,
        provider: this.providerName,
        model: 'flux-schnell',
        processingTimeMs: Date.now() - startTime,
        cost: this.config.tier.costPerImage,
      };

    } catch (error) {
      console.error('❌ BFL generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.providerName,
        model: 'flux-schnell',
        processingTimeMs: Date.now() - startTime,
        cost: 0,
      };
    }
  }

  private async pollForResult(requestId: string, startTime: number): Promise<{
    success: boolean;
    imageBuffer?: Buffer;
    processingTimeMs: number;
    cost: number;
    error?: string;
  }> {
    const maxAttempts = AI_CONFIG.BFL_POLL_MAX_ATTEMPTS;
    const pollInterval = AI_CONFIG.BFL_POLL_INTERVAL_MS;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`🔍 Polling BFL result (${attempt + 1}/${maxAttempts})...`);
        
        const response = await fetch(`${this.baseUrl}/get_result?id=${requestId}`, {
          method: 'GET',
          headers: {
            'x-key': this.apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Poll failed: ${response.status}`);
        }

        const result: BFLGenerationResponse = await response.json();
        console.log(`📊 BFL status: ${result.status}`);

        switch (result.status) {
          case 'Ready':
            if (result.result?.sample) {
              // Convert base64 to buffer
              const imageBuffer = Buffer.from(result.result.sample, 'base64');
              return {
                success: true,
                imageBuffer,
                processingTimeMs: Date.now() - startTime,
                cost: this.config.tier.costPerImage,
              };
            }
            throw new Error('Result ready but no image data received');

          case 'Content Moderated':
            return {
              success: false,
              error: 'Content was moderated by BFL safety filters',
              processingTimeMs: Date.now() - startTime,
              cost: this.config.tier.costPerImage, // Still charged for moderated content
            };

          case 'Request Moderated':
            return {
              success: false,
              error: 'Request was blocked by BFL safety filters',
              processingTimeMs: Date.now() - startTime,
              cost: 0,
            };

          case 'Request Pending':
            // Continue polling
            break;

          default:
            if (result.error) {
              throw new Error(result.error);
            }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error(`❌ Polling error (attempt ${attempt + 1}):`, error);
        
        if (attempt === maxAttempts - 1) {
          return {
            success: false,
            error: `Polling timeout after ${maxAttempts} attempts`,
            processingTimeMs: Date.now() - startTime,
            cost: 0,
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    return {
      success: false,
      error: 'Maximum polling attempts reached',
      processingTimeMs: Date.now() - startTime,
      cost: 0,
    };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('❌ BFL provider unavailable: No API key configured');
      return false;
    }

    try {
      // Simple health check - try to access the API
      const response = await fetch(`${this.baseUrl}/get_result?id=test`, {
        method: 'GET',
        headers: {
          'x-key': this.apiKey,
        },
      });

      // We expect a 404 or similar for invalid ID, but not 401 (unauthorized)
      const available = response.status !== 401;
      console.log(`🔍 BFL provider health check: ${available ? 'healthy' : 'unhealthy'} (status: ${response.status})`);
      return available;

    } catch (error) {
      console.log('❌ BFL provider health check failed:', error);
      return false;
    }
  }

}