/**
 * Tests for useImageGeneration React hook
 * Addresses React component testing coverage concerns
 */

import { renderHook, act } from '@testing-library/react';
import { useImageGeneration } from '../useImageGeneration';

// Mock the fetch function
global.fetch = jest.fn();

// Mock file reader
class MockFileReader {
  result: string | null = null;
  onload: ((event: any) => void) | null = null;
  readAsDataURL = jest.fn((file: File) => {
    this.result = `data:image/jpeg;base64,fake-base64-data`;
    setTimeout(() => this.onload && this.onload({} as any), 0);
  });
}

(global as any).FileReader = MockFileReader;

describe('useImageGeneration', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
    
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          imageUrl: 'https://example.com/generated-image.jpg',
          provider: 'pollinations',
          cost: 0.003,
          processingTime: 2500,
          generationId: 'test-gen-id'
        }
      })
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    test('should initialize with correct default values', () => {
      const { result } = renderHook(() => useImageGeneration());

      expect(result.current.currentStep).toBe('upload');
      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.selectedStyle).toBe('');
      expect(result.current.customPrompt).toBe('');
      expect(result.current.generatedImageUrl).toBe('');
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.generationProvider).toBe('');
      expect(result.current.dailyUsage).toBe(0);
    });
  });

  describe('File Upload', () => {
    test('should handle file upload successfully', async () => {
      const { result } = renderHook(() => useImageGeneration());
      
      const mockFile = new File(['fake-content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(result.current.uploadedFile).toBe(mockFile);
      expect(result.current.currentStep).toBe('styleSelect');
      expect(result.current.error).toBeNull();
    });

    test('should reject files that are too large', async () => {
      const { result } = renderHook(() => useImageGeneration());
      
      const mockFile = new File(['fake-content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB (over limit)

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.error).toBe('File size too large. Maximum size is 5MB.');
      expect(result.current.currentStep).toBe('upload');
    });

    test('should reject invalid file types', async () => {
      const { result } = renderHook(() => useImageGeneration());
      
      const mockFile = new File(['fake-content'], 'document.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.error).toBe('Invalid file type. Please upload an image.');
      expect(result.current.currentStep).toBe('upload');
    });
  });

  describe('Style Selection', () => {
    test('should handle style selection correctly', () => {
      const { result } = renderHook(() => useImageGeneration());

      act(() => {
        result.current.setSelectedStyle('realistic');
      });

      expect(result.current.selectedStyle).toBe('realistic');
    });

    test('should handle custom prompt input', () => {
      const { result } = renderHook(() => useImageGeneration());

      act(() => {
        result.current.setCustomPrompt('custom art style');
      });

      expect(result.current.customPrompt).toBe('custom art style');
    });
  });

  describe('Image Generation', () => {
    test('should generate image successfully with text prompt only', async () => {
      const { result } = renderHook(() => useImageGeneration());

      // Set up style selection state
      act(() => {
        result.current.setSelectedStyle('realistic');
        result.current.setCurrentStep('styleSelect');
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.currentStep).toBe('result');
      expect(result.current.generatedImageUrl).toBe('https://example.com/generated-image.jpg');
      expect(result.current.generationProvider).toBe('pollinations');
      expect(result.current.dailyUsage).toBe(1);
      expect(result.current.error).toBeNull();
    });

    test('should generate image with uploaded file (image-to-image)', async () => {
      const { result } = renderHook(() => useImageGeneration());
      
      const mockFile = new File(['fake-content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 });

      // Set up complete state
      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      act(() => {
        result.current.setSelectedStyle('watercolor');
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/generate',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );

      expect(result.current.currentStep).toBe('result');
      expect(result.current.generatedImageUrl).toBe('https://example.com/generated-image.jpg');
    });

    test('should handle generation errors gracefully', async () => {
      const { result } = renderHook(() => useImageGeneration());

      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Generation failed: No healthy providers available'
        })
      } as Response);

      act(() => {
        result.current.setSelectedStyle('realistic');
        result.current.setCurrentStep('styleSelect');
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.currentStep).toBe('styleSelect'); // Should stay on current step
      expect(result.current.error).toBe('Generation failed: No healthy providers available');
      expect(result.current.generatedImageUrl).toBe('');
    });

    test('should handle network errors during generation', async () => {
      const { result } = renderHook(() => useImageGeneration());

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      act(() => {
        result.current.setSelectedStyle('realistic');
        result.current.setCurrentStep('styleSelect');
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe('Upload error: Network error');
    });

    test('should show generating state during image generation', async () => {
      const { result } = renderHook(() => useImageGeneration());
      
      // Create a promise that we can control
      let resolveGeneration: (value: any) => void;
      const generationPromise = new Promise(resolve => {
        resolveGeneration = resolve;
      });

      mockFetch.mockReturnValueOnce(
        generationPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              imageUrl: 'https://example.com/generated-image.jpg',
              provider: 'pollinations'
            }
          })
        })) as Promise<Response>
      );

      act(() => {
        result.current.setSelectedStyle('realistic');
        result.current.setCurrentStep('styleSelect');
      });

      // Start generation
      const generatePromise = act(async () => {
        await result.current.handleGenerate();
      });

      // Should be in generating state
      expect(result.current.isGenerating).toBe(true);
      expect(result.current.currentStep).toBe('generating');

      // Complete generation
      resolveGeneration({});
      await generatePromise;

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.currentStep).toBe('result');
    });
  });

  describe('State Management', () => {
    test('should handle step navigation correctly', () => {
      const { result } = renderHook(() => useImageGeneration());

      act(() => {
        result.current.setCurrentStep('styleSelect');
      });
      expect(result.current.currentStep).toBe('styleSelect');

      act(() => {
        result.current.setCurrentStep('generating');
      });
      expect(result.current.currentStep).toBe('generating');

      act(() => {
        result.current.setCurrentStep('result');
      });
      expect(result.current.currentStep).toBe('result');
    });

    test('should reset state when starting over', () => {
      const { result } = renderHook(() => useImageGeneration());

      // Set up some state
      act(() => {
        result.current.setSelectedStyle('realistic');
        result.current.setCustomPrompt('test prompt');
        result.current.setCurrentStep('result');
      });

      // Reset/start over
      act(() => {
        result.current.handleStartOver();
      });

      expect(result.current.currentStep).toBe('upload');
      expect(result.current.uploadedFile).toBeNull();
      expect(result.current.selectedStyle).toBe('');
      expect(result.current.customPrompt).toBe('');
      expect(result.current.generatedImageUrl).toBe('');
      expect(result.current.error).toBeNull();
    });

    test('should clear errors when user takes action', async () => {
      const { result } = renderHook(() => useImageGeneration());

      // First, create an error state
      const mockFile = new File(['fake-content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 6 * 1024 * 1024 }); // Too large

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(result.current.error).toBeTruthy();

      // Now upload a valid file - should clear error
      const validFile = new File(['fake-content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 });

      await act(async () => {
        await result.current.handleFileUpload(validFile);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle FileReader errors gracefully', async () => {
      const { result } = renderHook(() => useImageGeneration());
      
      // Mock FileReader to fail
      const OriginalFileReader = (global as any).FileReader;
      (global as any).FileReader = class {
        readAsDataURL = jest.fn(() => {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('FileReader failed'));
            }
          }, 0);
        });
        onerror: ((error: any) => void) | null = null;
      };

      const mockFile = new File(['fake-content'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleFileUpload(mockFile);
      });

      expect(result.current.error).toBe('Failed to read file');
      
      // Restore original FileReader
      (global as any).FileReader = OriginalFileReader;
    });

    test('should validate prompt requirements', async () => {
      const { result } = renderHook(() => useImageGeneration());

      act(() => {
        result.current.setCurrentStep('styleSelect');
        result.current.setSelectedStyle(''); // No style selected
        result.current.setCustomPrompt(''); // No custom prompt
      });

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.error).toBe('Please select a style or enter a custom prompt.');
      expect(result.current.currentStep).toBe('styleSelect');
    });
  });
});