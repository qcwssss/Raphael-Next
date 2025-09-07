/**
 * Type-safe interfaces for AI provider system
 * Replaces 'any' types with proper TypeScript interfaces
 */

export interface HealthStatus {
  isHealthy: boolean;
  responseTime: number;
  error?: string;
  lastChecked: Date;
  providerName: string;
  endpoint: string;
}

export interface HealthCacheEntry {
  status: HealthStatus;
  timestamp: number;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  tier: {
    name: string;
    costPerImage: number;
    maxCost: number;
  };
}

export interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastFailure?: Date;
  lastSuccess?: Date;
}

export interface GenerationMetrics {
  startTime: number;
  endTime?: number;
  requestDuration?: number;
  provider: string;
  success: boolean;
  cost: number;
  error?: string;
}

export interface EnvironmentConfig {
  pollinations: {
    baseUrl: string;
    timeout: number;
  };
  huggingface: {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
  };
  bfl: {
    apiKey?: string;
    timeout: number;
  };
  flux: {
    apiKey?: string;
    timeout: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}