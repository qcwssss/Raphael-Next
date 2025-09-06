// Core AI Generation Types
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

// Provider Configuration Types
export interface AIProviderTier {
  name: 'free' | 'premium' | 'pro';
  displayName: string;
  costPerImage: number;
  estimatedSpeedSeconds: number;
  priority: number; // Lower number = higher priority
  enabled: boolean;
  description: string;
}

export interface AIProviderConfig {
  tier: AIProviderTier;
  maxRetries: number;
  timeoutMs: number;
  rateLimitPerMinute?: number;
}

// Provider Selection Types
export interface GenerationOptions {
  preferredTier?: 'free' | 'premium' | 'pro';
  maxCost?: number;
  maxTimeSeconds?: number;
  fallbackEnabled?: boolean;
}

export interface ProviderSelection {
  provider: string;
  reason: string;
  estimatedCost: number;
  estimatedTime: number;
}

// System Status Types
export interface ProviderHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked: string;
}

export interface SystemStatus {
  totalProviders: number;
  healthyProviders: number;
  availableStyles: string[];
  providers: Array<{
    name: string;
    status: string;
    tier: string;
    supportedStyles: string[];
  }>;
}

// API Request/Response Types
export interface GenerateApiRequest {
  sessionId: string;
  style: string;
  customPrompt?: string;
  inputFileName?: string;
}

export interface GenerateApiResponse {
  success: boolean;
  data?: {
    sessionId: string;
    generatedImageUrl: string;
    generatedFileName: string;
    provider: string;
    model: string;
    cost: number;
    processingTimeMs: number;
    style: string;
    generatedAt: string;
  };
  error?: string;
  details?: any;
}

export interface AIStatusResponse {
  timestamp: string;
  status: 'operational' | 'degraded' | 'error';
  environment: {
    replicateConfigured: boolean;
    r2Configured: boolean;
    appUrl: string;
  };
  providers: {
    total: number;
    healthy: number;
    details: Array<{
      name: string;
      status: string;
      tier: string;
      supportedStyles: string[];
    }>;
  };
  capabilities: {
    availableStyles: string[];
    supportedTiers: string[];
    estimatedCosts: Record<string, string>;
  };
  configuration: Array<{
    name: string;
    displayName: string;
    tier: string;
    costPerImage: number;
    estimatedSpeed: string;
    supportedStyles: string[];
    enabled: boolean;
  }>;
}

// Cost Tracking Types
export interface GenerationCost {
  sessionId: string;
  provider: string;
  model: string;
  style: string;
  cost: number;
  processingTimeMs: number;
  generatedAt: string;
  success: boolean;
}

export interface CostSummary {
  totalCost: number;
  totalGenerations: number;
  successfulGenerations: number;
  averageCost: number;
  averageProcessingTime: number;
  costByProvider: Record<string, number>;
  costByStyle: Record<string, number>;
}

// Error Types
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

export interface ErrorDetails {
  code: string;
  message: string;
  provider?: string;
  statusCode?: number;
  timestamp: string;
}

// Style Configuration Types
export type SupportedStyle = 'ghibli' | 'dragonball' | 'pixel' | 'oil' | 'cartoon';

export interface StyleConfiguration {
  id: SupportedStyle;
  name: string;
  description: string;
  emoji: string;
  promptTemplate: string;
  supportedProviders: string[];
  estimatedCost: number;
  estimatedTime: number;
}

// Session Management Types
export interface GenerationSession {
  sessionId: string;
  inputFileName: string;
  inputFileUrl: string;
  generations: Array<{
    style: string;
    generatedFileName: string;
    generatedFileUrl: string;
    provider: string;
    cost: number;
    processingTime: number;
    generatedAt: string;
  }>;
  totalCost: number;
  createdAt: string;
  lastActivity: string;
}

// Usage Tracking Types
export interface UsageStats {
  daily: {
    generations: number;
    cost: number;
    successRate: number;
  };
  monthly: {
    generations: number;
    cost: number;
    successRate: number;
  };
  byProvider: Record<string, {
    generations: number;
    cost: number;
    averageTime: number;
  }>;
  byStyle: Record<string, {
    generations: number;
    cost: number;
    averageTime: number;
  }>;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FileValidation extends ValidationResult {
  file?: {
    name: string;
    size: number;
    type: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

// Configuration Types
export interface AISystemConfig {
  maxDailyGenerations: number;
  maxMonthlyCost: number;
  defaultTimeout: number;
  enableFallback: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableUsageTracking: boolean;
  enableCostTracking: boolean;
}

// Future Extension Types (for additional providers)
export interface ProviderCapabilities {
  imageToImage: boolean;
  textToImage: boolean;
  imageUpscaling: boolean;
  backgroundRemoval: boolean;
  styleTransfer: boolean;
  batchProcessing: boolean;
  customModels: boolean;
}

export interface ModelConfiguration {
  name: string;
  version: string;
  inputFormats: string[];
  outputFormats: string[];
  maxResolution: {
    width: number;
    height: number;
  };
  minResolution: {
    width: number;
    height: number;
  };
  maxSteps: number;
  defaultSteps: number;
  capabilities: ProviderCapabilities;
}

// All types are already exported individually above