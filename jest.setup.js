// Jest setup file for additional test configuration

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

// Allow specific console messages but suppress others during tests
console.error = (...args) => {
  const message = args.join(' ');
  // Allow specific error messages that we want to test
  if (
    message.includes('Test error') ||
    message.includes('Failed to') ||
    message.includes('Storage error')
  ) {
    originalError(...args);
  }
  // Suppress other console.error during tests
};

console.warn = (...args) => {
  const message = args.join(' ');
  // Allow specific warning messages
  if (message.includes('Test warning')) {
    originalWarn(...args);
  }
  // Suppress other console.warn during tests
};

// Global test utilities
global.createMockFile = (overrides = {}) => ({
  name: 'test.jpg',
  size: 1024000, // 1MB
  type: 'image/jpeg',
  buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG header
  ...overrides,
});

global.createMockSessionId = () => '12345678-1234-4123-8123-123456789012';

// Restore console methods after all tests
afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});