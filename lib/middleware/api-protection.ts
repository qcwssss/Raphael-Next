import { NextApiRequest, NextApiResponse } from "next";
import { AI_CONFIG } from "../config/constants";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple API key authentication
 */
export function validateApiKey(req: NextApiRequest): boolean {
  // For development/demo, allow requests without API key
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.warn('⚠️ API_KEY not configured in environment variables');
    return true; // Allow if not configured
  }

  return apiKey === validApiKey;
}

/**
 * Rate limiting middleware
 */
export function checkRateLimit(req: NextApiRequest, limitPerMinute: number = AI_CONFIG.DEFAULT_RATE_LIMIT_PER_MINUTE): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  // Get client identifier (IP address or API key)
  const clientId = getClientId(req);
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  const entry = rateLimitStore.get(clientId);
  
  if (!entry || entry.resetTime <= now) {
    // No entry or expired, create new
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + 60000
    };
    rateLimitStore.set(clientId, newEntry);
    
    return {
      allowed: true,
      remaining: limitPerMinute - 1,
      resetTime: newEntry.resetTime
    };
  }
  
  if (entry.count >= limitPerMinute) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(clientId, entry);
  
  return {
    allowed: true,
    remaining: limitPerMinute - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(req: NextApiRequest): string {
  // Use API key if provided, otherwise fall back to IP
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    return `api:${apiKey}`;
  }
  
  // Get IP address
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

/**
 * Combined middleware for authentication and rate limiting
 */
export function withApiProtection(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: {
    requireApiKey?: boolean;
    rateLimitPerMinute?: number;
  } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { requireApiKey = false, rateLimitPerMinute = AI_CONFIG.DEFAULT_RATE_LIMIT_PER_MINUTE } = options;
    
    // Check API key if required
    if (requireApiKey && !validateApiKey(req)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or missing API key'
      });
    }
    
    // Check rate limit
    const rateLimit = checkRateLimit(req, rateLimitPerMinute);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimitPerMinute);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }
    
    // Continue to actual handler
    return handler(req, res);
  };
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [clientId, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(clientId);
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, AI_CONFIG.HEALTH_CHECK_CACHE_CLEANUP_INTERVAL_MS);
}