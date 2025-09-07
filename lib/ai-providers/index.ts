// Main exports for the AI provider system
export { BaseAIProvider, AIProviderError } from './base-provider';
export { FluxProvider } from './flux-provider';
export { AIProviderManager, aiProviderManager } from './provider-manager';

// Type exports
export type {
  AIGenerationRequest,
  AIGenerationResponse,
  AIProviderTier,
  AIProviderConfig,
  GenerationOptions,
  ProviderSelection,
  ProviderHealthStatus,
  SystemStatus,
  GenerateApiRequest,
  GenerateApiResponse,
  AIStatusResponse,
  GenerationCost,
  CostSummary,
  SupportedStyle,
  StyleConfiguration,
  GenerationSession,
  UsageStats,
  ValidationResult,
  FileValidation,
  AISystemConfig,
  ProviderCapabilities,
  ModelConfiguration
} from './types';

// Utility functions
export const SUPPORTED_STYLES: SupportedStyle[] = ['ghibli', 'dragonball', 'pixel', 'oil', 'cartoon'];

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  preferredTier: 'free',
  maxCost: 0.01,
  maxTimeSeconds: 120,
  fallbackEnabled: true
};

export const STYLE_DESCRIPTIONS: Record<SupportedStyle, StyleConfiguration> = {
  'ghibli': {
    id: 'ghibli',
    name: 'Studio Ghibli',
    description: 'Transform your image into the dreamy, hand-drawn style of Studio Ghibli films',
    emoji: '🌟',
    promptTemplate: 'Studio Ghibli anime style, hand-drawn animation, soft watercolor palette, dreamy atmosphere',
    supportedProviders: ['flux-schnell'],
    estimatedCost: 0.003,
    estimatedTime: 15
  },
  'dragonball': {
    id: 'dragonball',
    name: 'Dragon Ball',
    description: 'Convert to the dynamic, vibrant style of Dragon Ball anime',
    emoji: '🐉',
    promptTemplate: 'Dragon Ball anime style, Akira Toriyama art, dynamic action pose, vibrant colors',
    supportedProviders: ['flux-schnell'],
    estimatedCost: 0.003,
    estimatedTime: 15
  },
  'pixel': {
    id: 'pixel',
    name: 'Pixel Art',
    description: 'Transform into retro 16-bit pixel art style',
    emoji: '🎮',
    promptTemplate: 'pixel art style, 16-bit retro gaming graphics, crisp pixels, limited color palette',
    supportedProviders: ['flux-schnell'],
    estimatedCost: 0.003,
    estimatedTime: 15
  },
  'oil': {
    id: 'oil',
    name: 'Oil Painting',
    description: 'Convert to a classical oil painting with rich textures',
    emoji: '🎨',
    promptTemplate: 'classical oil painting style, Renaissance technique, rich impasto brushstrokes',
    supportedProviders: ['flux-schnell'],
    estimatedCost: 0.003,
    estimatedTime: 15
  },
  'cartoon': {
    id: 'cartoon',
    name: 'Cartoon',
    description: 'Transform into a vibrant cartoon illustration',
    emoji: '🎪',
    promptTemplate: 'cartoon illustration style, Western animation, bold outlines, bright saturated colors',
    supportedProviders: ['flux-schnell'],
    estimatedCost: 0.003,
    estimatedTime: 15
  }
};

// Import SupportedStyle type for the above constant
import type { SupportedStyle, StyleConfiguration, GenerationOptions } from './types';