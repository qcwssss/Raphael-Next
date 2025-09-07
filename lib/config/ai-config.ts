/**
 * Comprehensive AI provider configuration
 * Extracts all hardcoded values to a centralized configuration
 */

export const AI_PROVIDER_CONFIG = {
  // Global settings
  DEFAULT_TIMEOUT_MS: 60000,
  HEALTH_CACHE_TTL_MS: 60000, // 1 minute
  MAX_RETRY_ATTEMPTS: 3,
  EXPONENTIAL_BACKOFF_BASE_MS: 1000,
  
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    MAX_REQUESTS_PER_IP: 50,
    SKIP_RATE_LIMIT: false
  },

  // File upload constraints
  FILE_LIMITS: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ],
    MIN_DIMENSION: 64,
    MAX_DIMENSION: 2048
  },

  // Prompt validation
  PROMPT_VALIDATION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1500,
    FORBIDDEN_PATTERNS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /data:text\/html/gi
    ]
  },

  // Provider-specific configurations
  PROVIDERS: {
    POLLINATIONS: {
      name: 'pollinations',
      baseUrl: 'https://pollinations.ai',
      tier: {
        name: 'free',
        costPerImage: 0,
        maxCost: 0
      },
      timeout: 60000,
      retryAttempts: 2,
      enhancement: {
        minPromptLength: 10,
        enhancementSuffix: ', high quality, detailed, photorealistic, 8k resolution'
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 60000
      }
    },

    HUGGINGFACE: {
      name: 'huggingface-img2img',
      baseUrl: 'https://api-inference.huggingface.co',
      model: 'timbrooks/instruct-pix2pix',
      tier: {
        name: 'free',
        costPerImage: 0,
        maxCost: 0
      },
      timeout: 60000,
      retryAttempts: 3,
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeoutMs: 120000
      }
    },

    BFL: {
      name: 'bfl-flux-schnell',
      baseUrl: 'https://api.bfl.ml/v1',
      model: 'flux-schnell',
      tier: {
        name: 'standard',
        costPerImage: 0.003,
        maxCost: 0.01
      },
      timeout: 120000,
      retryAttempts: 2,
      polling: {
        maxAttempts: 60,
        pollInterval: 5000
      },
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeoutMs: 300000
      }
    },

    FLUX: {
      name: 'flux-dev',
      baseUrl: 'https://api.replicate.com/v1',
      model: 'black-forest-labs/flux-dev',
      tier: {
        name: 'premium',
        costPerImage: 0.030,
        maxCost: 0.05
      },
      timeout: 180000,
      retryAttempts: 2,
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeoutMs: 300000
      }
    }
  },

  // Error messages
  ERROR_MESSAGES: {
    PROMPT_REQUIRED: 'Prompt is required and cannot be empty',
    PROMPT_TOO_SHORT: 'Prompt must be at least {min} characters long',
    PROMPT_TOO_LONG: 'Prompt must be less than {max} characters long',
    FILE_TOO_LARGE: 'File size must be less than {maxSize}MB',
    INVALID_FILE_TYPE: 'Invalid file type. Supported types: {types}',
    INVALID_IMAGE_URL: 'Invalid input image URL format',
    NO_PROVIDERS_AVAILABLE: 'No suitable AI providers available',
    GENERATION_FAILED: 'Image generation failed',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later',
    PROVIDER_UNAVAILABLE: 'Provider {provider} is temporarily unavailable',
    TIMEOUT_ERROR: 'Request timed out after {timeout}ms',
    CIRCUIT_BREAKER_OPEN: 'Provider {provider} circuit breaker is open',
    VALIDATION_FAILED: 'Request validation failed: {errors}',
    AUTHENTICATION_FAILED: 'API authentication failed',
    INSUFFICIENT_CREDITS: 'Insufficient credits for provider {provider}'
  },

  // Security settings
  SECURITY: {
    TRUSTED_IMAGE_DOMAINS: [
      'pollinations.ai',
      'api-inference.huggingface.co',
      'replicate.delivery',
      'bfl.ml',
      'cdn.openai.com',
      'cloudflare.com',
      'amazonaws.com'
    ],
    API_KEY_REDACTED_LENGTH: 8,
    SANITIZE_HTML: true,
    VALIDATE_URLS: true
  },

  // Performance optimization
  PERFORMANCE: {
    ENABLE_CIRCUIT_BREAKERS: true,
    ENABLE_REQUEST_DEDUPLICATION: true,
    ENABLE_RESPONSE_CACHING: false, // Disabled by default for dynamic content
    CONCURRENT_HEALTH_CHECKS: 3,
    HEALTH_CHECK_DEBOUNCE_MS: 5000
  },

  // Monitoring and logging
  MONITORING: {
    LOG_REQUESTS: process.env.NODE_ENV === 'development',
    LOG_PERFORMANCE_METRICS: true,
    LOG_ERRORS: true,
    TRACK_USAGE_METRICS: true,
    ALERT_ON_HIGH_ERROR_RATE: 0.1, // 10%
    ALERT_ON_SLOW_RESPONSE: 30000 // 30 seconds
  }
} as const;

// Type definitions for configuration
export type AIProviderName = keyof typeof AI_PROVIDER_CONFIG.PROVIDERS;
export type ProviderConfig = typeof AI_PROVIDER_CONFIG.PROVIDERS[AIProviderName];
export type TierName = ProviderConfig['tier']['name'];

// Utility functions
export function getProviderConfig(providerName: AIProviderName): ProviderConfig {
  const config = AI_PROVIDER_CONFIG.PROVIDERS[providerName];
  if (!config) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  return config;
}

export function formatErrorMessage(messageKey: keyof typeof AI_PROVIDER_CONFIG.ERROR_MESSAGES, params: Record<string, any> = {}): string {
  let message = AI_PROVIDER_CONFIG.ERROR_MESSAGES[messageKey];
  
  // Replace placeholders with actual values
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  
  return message;
}

export function isTrustedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return AI_PROVIDER_CONFIG.SECURITY.TRUSTED_IMAGE_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export function sanitizePrompt(prompt: string): string {
  if (!AI_PROVIDER_CONFIG.SECURITY.SANITIZE_HTML) {
    return prompt;
  }

  let sanitized = prompt;
  
  // Remove potentially dangerous HTML/JS patterns
  AI_PROVIDER_CONFIG.PROMPT_VALIDATION.FORBIDDEN_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Trim and normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

export function validatePrompt(prompt: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = AI_PROVIDER_CONFIG.PROMPT_VALIDATION;
  
  if (!prompt || prompt.trim().length === 0) {
    errors.push(formatErrorMessage('PROMPT_REQUIRED'));
  } else {
    if (prompt.length < config.MIN_LENGTH) {
      errors.push(formatErrorMessage('PROMPT_TOO_SHORT', { min: config.MIN_LENGTH }));
    }
    
    if (prompt.length > config.MAX_LENGTH) {
      errors.push(formatErrorMessage('PROMPT_TOO_LONG', { max: config.MAX_LENGTH }));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateFileUpload(file: { size: number; mimetype: string }): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = AI_PROVIDER_CONFIG.FILE_LIMITS;
  
  if (file.size > config.MAX_FILE_SIZE) {
    errors.push(formatErrorMessage('FILE_TOO_LARGE', { 
      maxSize: (config.MAX_FILE_SIZE / 1024 / 1024).toFixed(1) 
    }));
  }
  
  if (!config.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    errors.push(formatErrorMessage('INVALID_FILE_TYPE', { 
      types: config.ALLOWED_MIME_TYPES.join(', ') 
    }));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}