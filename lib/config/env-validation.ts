/**
 * Environment variable validation for AI providers
 * Validates required environment variables at startup
 */

import { ValidationResult, EnvironmentConfig } from '../ai-providers/interfaces';

export interface RequiredEnvVars {
  optional: string[];
  recommended: string[];
}

const ENVIRONMENT_VARIABLES: RequiredEnvVars = {
  // Optional but recommended for full functionality
  optional: [
    'BFL_API_KEY',
    'BLACK_FOREST_LABS_API_KEY', 
    'HUGGINGFACE_API_TOKEN',
    'FLUX_API_KEY',
    'REPLICATE_API_TOKEN'
  ],
  // Recommended for production
  recommended: [
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'CLOUDFLARE_R2_ACCOUNT_ID'
  ]
};

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check optional API keys - these enable more AI providers
  for (const envVar of ENVIRONMENT_VARIABLES.optional) {
    if (!process.env[envVar]) {
      warnings.push(`${envVar} not set - some AI providers may be unavailable`);
    }
  }

  // Check recommended variables for production
  if (process.env.NODE_ENV === 'production') {
    for (const envVar of ENVIRONMENT_VARIABLES.recommended) {
      if (!process.env[envVar]) {
        warnings.push(`${envVar} not set - recommended for production deployment`);
      }
    }
  }

  // Validate URL formats if provided
  const urlVars = [
    { name: 'POLLINATIONS_BASE_URL', default: 'https://pollinations.ai' },
    { name: 'HUGGINGFACE_BASE_URL', default: 'https://api-inference.huggingface.co' }
  ];

  for (const { name, default: defaultUrl } of urlVars) {
    const url = process.env[name] || defaultUrl;
    try {
      new URL(url);
    } catch (error) {
      errors.push(`${name} contains invalid URL: ${url}`);
    }
  }

  // Validate numeric environment variables
  const numericVars = [
    { name: 'AI_REQUEST_TIMEOUT', default: '60000', min: 5000, max: 300000 },
    { name: 'MAX_FILE_SIZE', default: '5242880', min: 1048576, max: 52428800 } // 1MB to 50MB
  ];

  for (const { name, default: defaultValue, min, max } of numericVars) {
    const value = parseInt(process.env[name] || defaultValue);
    if (isNaN(value)) {
      errors.push(`${name} must be a valid number, got: ${process.env[name]}`);
    } else if (value < min || value > max) {
      warnings.push(`${name} value ${value} is outside recommended range ${min}-${max}`);
    }
  }

  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    warnings
  };
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    pollinations: {
      baseUrl: process.env.POLLINATIONS_BASE_URL || 'https://pollinations.ai',
      timeout: parseInt(process.env.POLLINATIONS_TIMEOUT || '60000')
    },
    huggingface: {
      baseUrl: process.env.HUGGINGFACE_BASE_URL || 'https://api-inference.huggingface.co',
      apiKey: process.env.HUGGINGFACE_API_TOKEN,
      timeout: parseInt(process.env.HUGGINGFACE_TIMEOUT || '60000')
    },
    bfl: {
      apiKey: process.env.BFL_API_KEY || process.env.BLACK_FOREST_LABS_API_KEY,
      timeout: parseInt(process.env.BFL_TIMEOUT || '120000')
    },
    flux: {
      apiKey: process.env.FLUX_API_KEY,
      timeout: parseInt(process.env.FLUX_TIMEOUT || '60000')
    }
  };
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  const config = getEnvironmentConfig();
  
  console.log('🔧 Environment Configuration Status:');
  
  if (validation.isValid) {
    console.log('✅ Environment validation passed');
  } else {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Log available providers based on API keys
  console.log('📊 Available AI Providers:');
  console.log(`  - Pollinations: ✅ (Free, no API key required)`);
  console.log(`  - HuggingFace: ${config.huggingface.apiKey ? '✅' : '⚠️  (Limited without API key)'}`);
  console.log(`  - Black Forest Labs: ${config.bfl.apiKey ? '✅' : '❌ (API key required)'}`);
  console.log(`  - FLUX: ${config.flux.apiKey ? '✅' : '❌ (API key required)'}`);
}