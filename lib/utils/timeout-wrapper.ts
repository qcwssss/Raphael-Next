/**
 * Timeout wrapper utility for handling long-running operations
 * Addresses performance optimization concerns from code review
 */

export interface TimeoutOptions {
  timeoutMs: number;
  timeoutMessage?: string;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export class TimeoutError extends Error {
  constructor(message: string, public readonly operation: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout and optional retry logic
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions,
  operationName: string = 'operation'
): Promise<T> {
  const {
    timeoutMs,
    timeoutMessage = `${operationName} timed out after ${timeoutMs}ms`,
    retryAttempts = 0,
    retryDelayMs = 1000
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new TimeoutError(timeoutMessage, operationName));
          }, timeoutMs);
          
          // Ensure timer is cleaned up
          return timer;
        })
      ]);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (error instanceof TimeoutError) {
        console.warn(`⏱️ ${operationName} timed out (attempt ${attempt + 1}/${retryAttempts + 1})`);
      } else {
        console.warn(`🔄 ${operationName} failed (attempt ${attempt + 1}/${retryAttempts + 1}):`, error);
      }
      
      // Don't retry on the last attempt
      if (attempt < retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  
  throw lastError;
}

/**
 * Specialized timeout wrapper for storage operations
 */
export async function withStorageTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000,
  operationName: string = 'storage operation'
): Promise<T> {
  return withTimeout(
    operation,
    {
      timeoutMs,
      timeoutMessage: `Storage operation timed out after ${timeoutMs}ms`,
      retryAttempts: 2,
      retryDelayMs: 1000
    },
    operationName
  );
}

/**
 * Specialized timeout wrapper for AI provider operations
 */
export async function withProviderTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 60000,
  operationName: string = 'AI provider operation'
): Promise<T> {
  return withTimeout(
    operation,
    {
      timeoutMs,
      timeoutMessage: `AI provider operation timed out after ${timeoutMs}ms`,
      retryAttempts: 3,
      retryDelayMs: 2000
    },
    operationName
  );
}

/**
 * Specialized timeout wrapper for HTTP requests with exponential backoff
 */
export async function withHttpTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000,
  operationName: string = 'HTTP request'
): Promise<T> {
  let retryDelay = 1000;
  const maxRetryAttempts = 3;
  
  for (let attempt = 0; attempt <= maxRetryAttempts; attempt++) {
    try {
      return await withTimeout(
        operation,
        {
          timeoutMs,
          timeoutMessage: `HTTP request timed out after ${timeoutMs}ms`,
          retryAttempts: 0 // Handle retries manually for exponential backoff
        },
        operationName
      );
    } catch (error) {
      if (attempt < maxRetryAttempts) {
        console.warn(`🔄 ${operationName} failed, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected code path');
}

/**
 * Circuit breaker pattern for frequently failing operations
 */
export class CircuitBreaker<T> {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly operation: () => Promise<T>,
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000,
    private readonly operationName: string = 'operation'
  ) {}

  async execute(): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'half-open';
        console.log(`🔄 Circuit breaker for ${this.operationName} moving to half-open state`);
      } else {
        throw new Error(`Circuit breaker is open for ${this.operationName}`);
      }
    }

    try {
      const result = await this.operation();
      
      if (this.state === 'half-open') {
        console.log(`✅ Circuit breaker for ${this.operationName} reset to closed state`);
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'open';
        console.error(`🚨 Circuit breaker for ${this.operationName} opened after ${this.failures} failures`);
      }
      
      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
    console.log(`🔄 Circuit breaker for ${this.operationName} manually reset`);
  }
}

/**
 * Memory-efficient debounce utility for frequent operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
        timeoutId = null;
      }, delayMs);
    });
  };
}