import { TRUSTED_IMAGE_DOMAINS } from '../config/constants';

/**
 * Validates if a URL is from a trusted domain
 */
export function isUrlFromTrustedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return TRUSTED_IMAGE_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Validates if a URL is a valid HTTP/HTTPS URL
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates if a URL is safe for external image access
 */
export function validateImageUrl(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: false, error: 'URL is required' };
  }

  if (!isValidHttpUrl(url)) {
    return { isValid: false, error: 'Invalid HTTP/HTTPS URL' };
  }

  if (!isUrlFromTrustedDomain(url)) {
    return { isValid: false, error: 'URL is from an untrusted domain' };
  }

  return { isValid: true };
}