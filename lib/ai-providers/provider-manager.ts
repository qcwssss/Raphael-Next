import {
  BaseAIProvider,
  AIGenerationRequest,
  AIGenerationResponse,
  AIProviderTier,
} from "./base-provider";
import { PollinationsProvider } from "./pollinations-provider";
import { HuggingFaceProvider } from "./huggingface-provider";
import { FluxProvider } from "./flux-provider";
import { BFLProvider } from "./bfl-provider";

export interface ProviderSelection {
  provider: BaseAIProvider;
  reason: string;
  estimatedCost: number;
  estimatedTime: number;
}

export interface GenerationOptions {
  preferredTier?: "free" | "premium" | "pro";
  maxCost?: number;
  maxTimeSeconds?: number;
  fallbackEnabled?: boolean;
}

export class AIProviderManager {
  private providers: BaseAIProvider[] = [];
  private healthCache: Map<string, { status: any; timestamp: number }> =
    new Map();
  private readonly healthCacheTtl = 60000; // 1 minute

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    try {
      // Initialize providers - prioritize free Pollinations first

      // Pollinations as primary free provider (no API key needed)
      const pollinationsProvider = new PollinationsProvider();
      this.providers.push(pollinationsProvider);
      console.log(
        "✅ Initialized AI provider: pollinations (Free Pollinations.ai)"
      );

      // HuggingFace as secondary free provider
      const hfProvider = new HuggingFaceProvider();
      this.providers.push(hfProvider);
      console.log(
        "✅ Initialized AI provider: huggingface-img2img (Free HuggingFace)"
      );

      // BFL as premium provider (requires credits)
      if (process.env.BFL_API_KEY) {
        const bflProvider = new BFLProvider();
        this.providers.push(bflProvider);
        console.log(
          "✅ Initialized AI provider: bfl-flux-schnell (Direct BFL API)"
        );
      }

      // Fallback to Replicate if needed
      if (process.env.REPLICATE_API_TOKEN) {
        const fluxProvider = new FluxProvider();
        this.providers.push(fluxProvider);
        console.log("✅ Initialized AI provider: flux-schnell (Replicate)");
      }
    } catch (error) {
      console.error("❌ Failed to initialize AI providers:", error);
    }

    if (this.providers.length === 0) {
      console.warn("⚠️ No AI providers could be initialized");
    } else {
      console.log(
        `🎯 AI Provider Manager initialized with ${this.providers.length} provider(s)`
      );
    }
  }

  /**
   * Select the best available provider for a generation request
   */
  async selectProvider(
    request: AIGenerationRequest,
    options: GenerationOptions = {}
  ): Promise<ProviderSelection> {
    const {
      preferredTier = "free",
      maxCost = 0.01, // Default max cost for free tier
      maxTimeSeconds = 300, // 5 minutes max
      fallbackEnabled = true,
    } = options;

    console.log(
      `🎯 Selecting AI provider for style '${request.style}' with tier preference: ${preferredTier}`
    );

    // Get available providers that support the requested style
    const supportedProviders = this.providers.filter((provider) =>
      provider.isSupported(request)
    );

    if (supportedProviders.length === 0) {
      throw new Error(`No AI providers support style: ${request.style}`);
    }

    // Check health status for supported providers
    const healthyProviders: Array<{ provider: BaseAIProvider; health: any }> =
      [];

    for (const provider of supportedProviders) {
      try {
        const health = await this.getProviderHealth(provider);
        if (health.status === "healthy") {
          healthyProviders.push({ provider, health });
        } else {
          console.warn(
            `⚠️ Provider ${provider.providerName} is ${health.status}: ${health.message}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Health check failed for ${provider.providerName}:`,
          error
        );
      }
    }

    if (healthyProviders.length === 0) {
      throw new Error("No healthy AI providers available");
    }

    // Score and rank providers
    const scoredProviders = healthyProviders.map(({ provider, health }) => {
      const config = provider.getConfig();
      const estimatedCost = provider.estimateCost(request);
      const estimatedTime = config.tier.estimatedSpeedSeconds;

      let score = 0;
      let reason = "";

      // Tier preference scoring
      if (config.tier.name === preferredTier) {
        score += 100;
        reason += `Preferred tier (${preferredTier}), `;
      } else {
        score += Math.max(
          0,
          50 -
            Math.abs(
              this.getTierPriority(config.tier.name) -
                this.getTierPriority(preferredTier)
            ) *
              10
        );
      }

      // Cost constraint scoring
      if (estimatedCost <= maxCost) {
        score += 50;
        reason += `Within budget ($${estimatedCost} <= $${maxCost}), `;
      } else {
        score -= (estimatedCost - maxCost) * 1000; // Heavy penalty for over-budget
        reason += `Over budget ($${estimatedCost} > $${maxCost}), `;
      }

      // Time constraint scoring
      if (estimatedTime <= maxTimeSeconds) {
        score += 30;
        reason += `Fast enough (${estimatedTime}s <= ${maxTimeSeconds}s), `;
      } else {
        score -= (estimatedTime - maxTimeSeconds) / 10;
        reason += `Too slow (${estimatedTime}s > ${maxTimeSeconds}s), `;
      }

      // Provider priority (from config)
      score += 100 - config.tier.priority * 10;
      reason += `Priority: ${config.tier.priority}`;

      return {
        provider,
        score,
        estimatedCost,
        estimatedTime,
        reason: reason.replace(/, $/, ""), // Remove trailing comma
      };
    });

    // Sort by score (highest first)
    scoredProviders.sort((a, b) => b.score - a.score);

    const bestProvider = scoredProviders[0];

    if (bestProvider.score <= 0 && !fallbackEnabled) {
      throw new Error("No suitable AI provider found within constraints");
    }

    console.log(
      `🏆 Selected provider: ${bestProvider.provider.providerName} (score: ${bestProvider.score}, cost: $${bestProvider.estimatedCost}, time: ${bestProvider.estimatedTime}s)`
    );

    return {
      provider: bestProvider.provider,
      reason: bestProvider.reason,
      estimatedCost: bestProvider.estimatedCost,
      estimatedTime: bestProvider.estimatedTime,
    };
  }

  /**
   * Generate image using the best available provider
   */
  async generateImage(
    request: AIGenerationRequest,
    options: GenerationOptions = {}
  ): Promise<AIGenerationResponse> {
    const selection = await this.selectProvider(request, options);

    console.log(
      `🎨 Generating image with ${selection.provider.providerName}: ${selection.reason}`
    );

    return await selection.provider.generateImage(request);
  }

  /**
   * Get health status for a provider (with caching)
   */
  async getProviderHealth(provider: BaseAIProvider): Promise<any> {
    const cacheKey = provider.providerName;
    const cached = this.healthCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.healthCacheTtl) {
      return cached.status;
    }

    const health = await provider.getHealthStatus();
    this.healthCache.set(cacheKey, { status: health, timestamp: Date.now() });

    return health;
  }

  /**
   * Get all available providers with their configurations
   */
  getAvailableProviders(): Array<{
    name: string;
    tier: AIProviderTier;
    supportedStyles: string[];
    isConfigured: boolean;
  }> {
    return this.providers.map((provider) => ({
      name: provider.providerName,
      tier: provider.getConfig().tier,
      supportedStyles: provider.supportedStyles,
      isConfigured: true, // If it was initialized, it's configured
    }));
  }

  /**
   * Get system status including all providers
   */
  async getSystemStatus(): Promise<{
    totalProviders: number;
    healthyProviders: number;
    availableStyles: string[];
    providers: Array<{
      name: string;
      status: string;
      tier: string;
      supportedStyles: string[];
    }>;
  }> {
    const providers = [];
    let healthyCount = 0;
    const allStyles = new Set<string>();

    for (const provider of this.providers) {
      const health = await this.getProviderHealth(provider);
      const config = provider.getConfig();

      if (health.status === "healthy") {
        healthyCount++;
        provider.supportedStyles.forEach((style) => allStyles.add(style));
      }

      providers.push({
        name: provider.providerName,
        status: health.status,
        tier: config.tier.displayName,
        supportedStyles: provider.supportedStyles,
      });
    }

    return {
      totalProviders: this.providers.length,
      healthyProviders: healthyCount,
      availableStyles: Array.from(allStyles),
      providers,
    };
  }

  /**
   * Estimate cost for a generation request
   */
  async estimateCost(
    request: AIGenerationRequest,
    options: GenerationOptions = {}
  ): Promise<{
    estimatedCost: number;
    provider: string;
    tier: string;
  }> {
    const selection = await this.selectProvider(request, options);

    return {
      estimatedCost: selection.estimatedCost,
      provider: selection.provider.providerName,
      tier: selection.provider.getConfig().tier.name,
    };
  }

  private getTierPriority(tier: string): number {
    const priorities = {
      free: 1,
      premium: 2,
      pro: 3,
    };
    return priorities[tier as keyof typeof priorities] || 999;
  }

  /**
   * Clear health cache (useful for testing or forcing refresh)
   */
  clearHealthCache(): void {
    this.healthCache.clear();
    console.log("🗑️ Provider health cache cleared");
  }

  /**
   * Add a new provider (useful for extending the system)
   */
  addProvider(provider: BaseAIProvider): void {
    this.providers.push(provider);
    console.log(`➕ Added new AI provider: ${provider.providerName}`);
  }

  /**
   * Remove a provider
   */
  removeProvider(providerName: string): boolean {
    const initialLength = this.providers.length;
    this.providers = this.providers.filter(
      (p) => p.providerName !== providerName
    );
    this.healthCache.delete(providerName);

    const removed = this.providers.length < initialLength;
    if (removed) {
      console.log(`➖ Removed AI provider: ${providerName}`);
    }

    return removed;
  }
}

// Export singleton instance
export const aiProviderManager = new AIProviderManager();
