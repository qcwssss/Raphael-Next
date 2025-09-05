/**
 * Simple test utilities to validate storage implementation
 * This is for development testing - not production unit tests
 */

import { CloudflareR2Storage } from '../storage/cloudflare-r2';
import { validateFile, generateSessionId, FileInfo } from './file-utils';
import { validateEnvironmentVariables } from './validation';

/**
 * Test environment configuration
 */
export function testEnvironmentSetup(): boolean {
  console.log('🔍 Testing environment setup...');
  
  const errors = validateEnvironmentVariables();
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => {
      console.error(`  - ${error.field}: ${error.message}`);
    });
    return false;
  }
  
  console.log('✅ Environment variables validated');
  return true;
}

/**
 * Test file validation
 */
export function testFileValidation(): boolean {
  console.log('🔍 Testing file validation...');
  
  // Test valid file
  const validFile: FileInfo = {
    name: 'test.jpg',
    size: 1024000, // 1MB
    type: 'image/jpeg',
    buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]) // JPEG header
  };
  
  const validResult = validateFile(validFile);
  if (!validResult.isValid) {
    console.error('❌ Valid file validation failed:', validResult.error);
    return false;
  }
  
  // Test invalid file type
  const invalidTypeFile: FileInfo = {
    name: 'test.txt',
    size: 1000,
    type: 'text/plain',
    buffer: Buffer.from('hello world')
  };
  
  const invalidTypeResult = validateFile(invalidTypeFile);
  if (invalidTypeResult.isValid) {
    console.error('❌ Invalid file type should have failed validation');
    return false;
  }
  
  // Test oversized file
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
  const oversizedFile: FileInfo = {
    name: 'big.jpg',
    size: maxSize + 1,
    type: 'image/jpeg',
    buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])
  };
  
  const oversizedResult = validateFile(oversizedFile);
  if (oversizedResult.isValid) {
    console.error('❌ Oversized file should have failed validation');
    return false;
  }
  
  console.log('✅ File validation working correctly');
  return true;
}

/**
 * Test session ID generation
 */
export function testSessionIdGeneration(): boolean {
  console.log('🔍 Testing session ID generation...');
  
  const sessionId = generateSessionId();
  
  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(sessionId)) {
    console.error('❌ Generated session ID is not valid UUID v4:', sessionId);
    return false;
  }
  
  console.log('✅ Session ID generation working correctly:', sessionId);
  return true;
}

/**
 * Test storage initialization (doesn't require actual R2 connection)
 */
export function testStorageInitialization(): boolean {
  console.log('🔍 Testing storage initialization...');
  
  try {
    const storage = new CloudflareR2Storage();
    console.log('✅ CloudflareR2Storage initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Storage initialization failed:', error);
    return false;
  }
}

/**
 * Run all basic tests
 */
export function runBasicTests(): boolean {
  console.log('🚀 Running basic storage tests...\n');
  
  const tests = [
    testEnvironmentSetup,
    testFileValidation,
    testSessionIdGeneration,
    testStorageInitialization,
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    const passed = test();
    if (!passed) allPassed = false;
    console.log(''); // Add spacing between tests
  }
  
  if (allPassed) {
    console.log('🎉 All basic tests passed!');
  } else {
    console.log('💥 Some tests failed!');
  }
  
  return allPassed;
}

/**
 * Mock file upload test (requires actual R2 credentials)
 */
export async function testFileUpload(): Promise<boolean> {
  console.log('🔍 Testing file upload (requires R2 credentials)...');
  
  try {
    const storage = new CloudflareR2Storage();
    const sessionId = generateSessionId();
    
    // Create a small test image buffer
    const testImageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      // Minimal JPEG header for testing
    ]);
    
    const fileKey = await storage.uploadFile(
      sessionId,
      'test.jpg',
      testImageBuffer,
      'image/jpeg'
    );
    
    console.log('✅ File uploaded successfully:', fileKey);
    
    // Test file exists
    const exists = await storage.fileExists(fileKey);
    if (!exists) {
      console.error('❌ Uploaded file does not exist');
      return false;
    }
    
    // Clean up test file
    await storage.deleteFile(fileKey);
    console.log('✅ Test file cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ File upload test failed:', error);
    return false;
  }
}