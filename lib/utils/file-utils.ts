import { randomUUID } from "crypto";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  buffer: Buffer;
}

/**
 * Generate a unique session ID using UUID v4
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Validate uploaded file meets requirements
 */
export function validateFile(file: FileInfo): ValidationResult {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || "5242880"); // 5MB default

  if (!file) {
    return { isValid: false, error: "No file provided" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Only JPG and PNG are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
    };
  }

  if (file.size === 0) {
    return { isValid: false, error: "Empty file not allowed." };
  }

  // Basic file header validation
  if (!isValidImageHeader(file.buffer)) {
    return {
      isValid: false,
      error: "Invalid image file format.",
    };
  }

  return { isValid: true };
}

/**
 * Validate image file headers to ensure it's actually an image
 */
function isValidImageHeader(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // Check for JPEG header (FF D8 FF)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // Check for PNG header (89 50 4E 47)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  return false;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  if (!filename.includes('.')) return '';
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Generate safe filename for storage
 */
export function generateSafeFilename(originalName: string, sessionId: string): string {
  const timestamp = Date.now();
  const extension = getFileExtension(originalName);
  return `${sessionId}_${timestamp}.${extension}`;
}

/**
 * Validate session ID format (UUID v4)
 */
export function validateSessionId(sessionId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file type is supported
 */
export function isSupportedImageType(contentType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  return supportedTypes.includes(contentType.toLowerCase());
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace unsafe characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}