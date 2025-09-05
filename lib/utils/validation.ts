/**
 * Input validation utilities
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate style selection
 */
export function isValidStyle(style: string): boolean {
  const validStyles = [
    'ghibli',
    'dragonball',
    'pixel',
    'oil',
    'cartoon',
    'custom'
  ];
  return validStyles.includes(style);
}

/**
 * Sanitize and validate custom prompt
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return '';

  // Remove potentially harmful content
  const sanitized = prompt
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 500); // Limit length

  return sanitized;
}

/**
 * Validate custom prompt
 */
export function isValidPrompt(prompt: string): boolean {
  if (!prompt) return true; // Optional field
  
  const sanitized = sanitizePrompt(prompt);
  return sanitized.length > 0 && sanitized.length <= 500;
}

/**
 * Validate user tier
 */
export function isValidUserTier(tier: string): boolean {
  const validTiers = ['free', 'paid', 'premium'];
  return validTiers.includes(tier);
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Validate environment variables are set
 */
export function validateEnvironmentVariables(): ValidationError[] {
  const errors: ValidationError[] = [];
  
  const requiredEnvVars = [
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 
    'CLOUDFLARE_R2_BUCKET_NAME',
    'CLOUDFLARE_R2_ACCOUNT_ID'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push({
        field: envVar,
        message: `Environment variable ${envVar} is required`
      });
    }
  }

  return errors;
}

/**
 * Validate API request parameters
 */
export function validateGenerationRequest(params: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!params.sessionId || !params.sessionId.trim()) {
    errors.push({
      field: 'sessionId',
      message: 'Session ID is required'
    });
  }

  if (!params.style || !isValidStyle(params.style)) {
    errors.push({
      field: 'style',
      message: 'Valid style selection is required'
    });
  }

  if (params.customPrompt && !isValidPrompt(params.customPrompt)) {
    errors.push({
      field: 'customPrompt',
      message: 'Custom prompt must be less than 500 characters'
    });
  }

  if (params.userTier && !isValidUserTier(params.userTier)) {
    errors.push({
      field: 'userTier',
      message: 'Invalid user tier specified'
    });
  }

  return errors;
}