import { 
  generateSessionId, 
  validateFile, 
  validateSessionId,
  getFileExtension,
  formatFileSize,
  isSupportedImageType 
} from '../file-utils';

describe('File Utils', () => {
  describe('generateSessionId', () => {
    it('should generate a valid UUID v4', () => {
      const sessionId = generateSessionId();
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      
      // UUID v4 format check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(sessionId).toMatch(uuidRegex);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('validateSessionId', () => {
    it('should validate correct UUID v4 format', () => {
      const validId = '12345678-1234-4123-8123-123456789012';
      expect(validateSessionId(validId)).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateSessionId('invalid-id')).toBe(false);
      expect(validateSessionId('12345678-1234-1234-1234-123456789012')).toBe(false); // version 1
      expect(validateSessionId('')).toBe(false);
      expect(validateSessionId('12345678123412341234123456789012')).toBe(false); // no dashes
    });
  });

  describe('validateFile', () => {
    it('should validate correct JPEG file', () => {
      const validFile = {
        name: 'test.jpg',
        size: 1024000, // 1MB
        type: 'image/jpeg',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]) // JPEG header
      };
      
      const result = validateFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate correct PNG file', () => {
      const validFile = {
        name: 'test.png',
        size: 1024000, // 1MB  
        type: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4E, 0x47]) // PNG header
      };
      
      const result = validateFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid file types', () => {
      const invalidFile = {
        name: 'test.txt',
        size: 1000,
        type: 'text/plain',
        buffer: Buffer.from('hello world')
      };
      
      const result = validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid file type. Only JPG and PNG are allowed.');
    });

    it('should reject oversized files', () => {
      const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
      const oversizedFile = {
        name: 'big.jpg',
        size: maxSize + 1,
        type: 'image/jpeg',
        buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])
      };
      
      const result = validateFile(oversizedFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File too large');
    });

    it('should reject empty files', () => {
      const emptyFile = {
        name: 'empty.jpg',
        size: 0,
        type: 'image/jpeg',
        buffer: Buffer.alloc(0)
      };
      
      const result = validateFile(emptyFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Empty file not allowed.');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg');
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('FILE.PNG')).toBe('png');
    });

    it('should handle files without extensions', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('')).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('isSupportedImageType', () => {
    it('should recognize supported image types', () => {
      expect(isSupportedImageType('image/jpeg')).toBe(true);
      expect(isSupportedImageType('image/jpg')).toBe(true);
      expect(isSupportedImageType('image/png')).toBe(true);
      expect(isSupportedImageType('image/webp')).toBe(true);
    });

    it('should reject unsupported types', () => {
      expect(isSupportedImageType('text/plain')).toBe(false);
      expect(isSupportedImageType('application/pdf')).toBe(false);
      expect(isSupportedImageType('image/gif')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isSupportedImageType('IMAGE/JPEG')).toBe(true);
      expect(isSupportedImageType('Image/Png')).toBe(true);
    });
  });
});