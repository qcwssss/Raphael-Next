// Configuration constants for the AI provider system
export const AI_CONFIG = {
  // File upload constraints
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Generation constraints
  MAX_COST_PER_GENERATION: 0.01, // $0.01
  MAX_GENERATION_TIME_SECONDS: 120, // 2 minutes
  
  // Provider timeouts
  PROVIDER_TIMEOUT_MS: 60000, // 1 minute
  BFL_PROVIDER_TIMEOUT_MS: 300000, // 5 minutes (for BFL polling)
  HEALTH_CHECK_TIMEOUT_MS: 10000, // 10 seconds
  
  // Caching
  HEALTH_CACHE_TTL_MS: 60000, // 1 minute
  
  // Rate limiting
  DEFAULT_RATE_LIMIT_PER_MINUTE: 60,
  
  // Image generation defaults
  DEFAULT_IMAGE_WIDTH: 1024,
  DEFAULT_IMAGE_HEIGHT: 1024,
  
  // Retry settings
  DEFAULT_MAX_RETRIES: 3,
  
  // Polling settings
  BFL_POLL_MAX_ATTEMPTS: 60, // 5 minutes max (5s intervals)
  BFL_POLL_INTERVAL_MS: 5000, // 5 seconds
  
  // Health check settings
  HEALTH_CHECK_CACHE_CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: "File size exceeds the maximum limit of 5MB",
  UPLOAD_FAILED: "Failed to upload file. Please try again.",
  GENERATION_FAILED: "Failed to generate image. Please try again.",
  INVALID_SESSION: "Invalid session. Please upload an image first.",
  PROVIDER_UNAVAILABLE: "AI provider is currently unavailable",
  NETWORK_ERROR: "Network error occurred. Please check your connection.",
  INVALID_URL: "Invalid image URL provided",
  UNTRUSTED_DOMAIN: "Image URL from untrusted domain",
} as const;

// Trusted domains for external image sources
export const TRUSTED_IMAGE_DOMAINS = [
  'image.pollinations.ai',
  'cdn.openai.com',
  'replicate.delivery',
  'pbxt.replicate.delivery',
  'storage.googleapis.com',
  // Add more trusted domains as needed
] as const;