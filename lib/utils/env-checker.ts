/**
 * Environment checker utility to validate setup for real file uploads
 */

export interface EnvCheckResult {
  isReady: boolean;
  missing: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Check if environment is ready for real file uploads
 */
export function checkUploadEnvironment(): EnvCheckResult {
  const result: EnvCheckResult = {
    isReady: false,
    missing: [],
    warnings: [],
    suggestions: []
  };

  // Required environment variables for file upload
  const requiredEnvVars = [
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'CLOUDFLARE_R2_ACCOUNT_ID'
  ];

  // Optional but recommended
  const optionalEnvVars = [
    'MAX_FILE_SIZE',
    'NEXT_PUBLIC_APP_URL'
  ];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value || value.startsWith('mock-') || value.startsWith('your_')) {
      result.missing.push(envVar);
    }
  }

  // Check optional variables
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      result.warnings.push(`${envVar} not set (will use defaults)`);
    }
  }

  // Provide suggestions based on missing variables
  if (result.missing.length > 0) {
    result.suggestions.push('Set up a Cloudflare R2 account at https://dash.cloudflare.com/');
    result.suggestions.push('Create an R2 bucket for file storage');
    result.suggestions.push('Generate R2 API tokens with read/write permissions');
    result.suggestions.push('Add the real credentials to your .env.local file');
    result.suggestions.push('Restart your Next.js development server after updating .env.local');
  }

  // Special checks
  if (process.env.CLOUDFLARE_R2_BUCKET_NAME === 'mock-bucket') {
    result.warnings.push('Using mock bucket name - uploads will fail');
  }

  result.isReady = result.missing.length === 0;

  return result;
}

/**
 * Get formatted environment status report
 */
export function getEnvironmentStatusReport(): string {
  const check = checkUploadEnvironment();
  
  let report = '🔍 Upload Environment Status\n';
  report += '================================\n\n';

  if (check.isReady) {
    report += '✅ Environment is ready for real file uploads!\n\n';
  } else {
    report += '❌ Environment is NOT ready for real file uploads\n\n';
  }

  if (check.missing.length > 0) {
    report += '🚫 Missing Required Variables:\n';
    check.missing.forEach(env => {
      report += `   - ${env}\n`;
    });
    report += '\n';
  }

  if (check.warnings.length > 0) {
    report += '⚠️  Warnings:\n';
    check.warnings.forEach(warning => {
      report += `   - ${warning}\n`;
    });
    report += '\n';
  }

  if (check.suggestions.length > 0) {
    report += '💡 Setup Steps:\n';
    check.suggestions.forEach((suggestion, index) => {
      report += `   ${index + 1}. ${suggestion}\n`;
    });
    report += '\n';
  }

  // Current values (masked for security)
  report += '📋 Current Configuration:\n';
  report += `   CLOUDFLARE_R2_ACCESS_KEY_ID: ${maskValue(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID)}\n`;
  report += `   CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${maskValue(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY)}\n`;
  report += `   CLOUDFLARE_R2_BUCKET_NAME: ${process.env.CLOUDFLARE_R2_BUCKET_NAME || 'not set'}\n`;
  report += `   CLOUDFLARE_R2_ACCOUNT_ID: ${maskValue(process.env.CLOUDFLARE_R2_ACCOUNT_ID)}\n`;
  report += `   MAX_FILE_SIZE: ${process.env.MAX_FILE_SIZE || '5242880 (default)'}\n`;

  return report;
}

/**
 * Mask sensitive values for display
 */
function maskValue(value?: string): string {
  if (!value) return 'not set';
  if (value.startsWith('mock-') || value.startsWith('your_')) return value;
  if (value.length < 8) return '***';
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}