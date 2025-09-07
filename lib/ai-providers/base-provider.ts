export interface AIGenerationRequest {
  inputImageUrl: string;
  style: string;
  customPrompt?: string;
  sessionId: string;
}

export interface AIGenerationResponse {
  success: boolean;
  generatedImageUrl?: string;
  error?: string;
  provider: string;
  model: string;
  cost: number;
  processingTimeMs: number;
}

export interface AIProviderTier {
  name: string;
  displayName: string;
  costPerImage: number;
  estimatedSpeedSeconds: number;
  priority: number; // Lower number = higher priority
  enabled: boolean;
  description: string;
}

export interface AIProviderStats {
  totalGenerations: number;
  totalCost: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface AIProviderConfig {
  tier: AIProviderTier;
  maxRetries: number;
  timeoutMs: number;
  rateLimitPerMinute?: number;
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;
  
  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract get providerName(): string;
  abstract get supportedStyles(): string[];

  /**
   * Generate an image using the AI provider
   */
  abstract generateImage(request: AIGenerationRequest): Promise<AIGenerationResponse>;

  /**
   * Build the prompt for the specific style
   */
  protected buildPrompt(style: string, customPrompt?: string, isTextToImage: boolean = false): string {
    // For custom styles, the customPrompt IS the style description
    if (style === 'custom') {
      return customPrompt || (isTextToImage ? 'high quality, detailed artwork' : 'artistic style transformation, high quality, detailed');
    }

    // Load style prompts from configuration
    const basePrompt = this.getStylePrompt(style);
    
    if (customPrompt) {
      return isTextToImage 
        ? `${customPrompt}, ${basePrompt}`
        : `${customPrompt}, ${basePrompt}`;
    }

    return isTextToImage 
      ? `${basePrompt}, high quality, detailed`
      : `Transform this image ${basePrompt}, high quality, detailed`;
  }

  /**
   * Get style prompt from configuration
   */
  private getStylePrompt(styleId: string): string {
    try {
      // Import the styles configuration
      const stylesConfig = require('../../config/styles.json');
      
      // Find the style in predefined styles
      const style = stylesConfig.predefinedStyles.find((s: any) => s.id === styleId);
      
      if (style && style.prompt) {
        return style.prompt;
      }
      
      // Fallback for unknown styles
      return 'artistic style transformation';
    } catch (error) {
      console.warn(`Failed to load style prompt for ${styleId}:`, error);
      return 'artistic style transformation';
    }
  }

  /**
   * Validate if the request is supported by this provider
   */
  isSupported(request: AIGenerationRequest): boolean {
    // All providers should support custom styles
    if (request.style === 'custom') {
      return true;
    }
    return this.supportedStyles.includes(request.style);
  }

  /**
   * Get provider configuration
   */
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Check if provider is available and properly configured
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Estimate cost for a generation request
   */
  estimateCost(request: AIGenerationRequest): number {
    return this.config.tier.costPerImage;
  }

  /**
   * Get provider health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    lastChecked: string;
  }> {
    try {
      const isAvailable = await this.isAvailable();
      return {
        status: isAvailable ? 'healthy' : 'unhealthy',
        message: isAvailable ? undefined : 'Provider not available',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Retry logic wrapper for generation requests
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`${this.providerName} attempt ${attempt} failed, retrying in ${delayMs}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw lastError || new Error(`Max retries (${maxRetries}) exceeded`);
  }

  /**
   * Timeout wrapper for operations
   */
  protected async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number = this.config.timeoutMs
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    );

    return Promise.race([operation, timeoutPromise]);
  }
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}