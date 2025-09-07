import type { NextApiRequest, NextApiResponse } from 'next';
import { aiProviderManager } from '../../lib/ai-providers';

interface GenerateTextRequest {
  prompt: string;
  options?: {
    squareAspect?: boolean;
    noStyle?: boolean;
    noColor?: boolean;
    noLighting?: boolean;
    noComposition?: boolean;
    negativePrompt?: boolean;
    highQuality?: boolean;
  };
  count?: number; // Number of images to generate (default: 1)
}

interface GenerateTextResponse {
  success: boolean;
  data?: {
    generatedImages: string[];
    provider: string;
    model: string;
    totalCost: number;
    processingTimeMs: number;
    generatedAt: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateTextResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const startTime = Date.now();

  try {
    const { prompt, options = {}, count = 1 }: GenerateTextRequest = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a non-empty string'
      });
    }

    if (count < 1 || count > 1) {
      return res.status(400).json({
        success: false,
        error: 'Count must be 1'
      });
    }

    console.log(`🎨 Starting text-to-image generation for prompt: "${prompt.substring(0, 100)}..."`);
    console.log(`📊 Options:`, options);
    console.log(`🔢 Generating ${count} images`);

    // Build enhanced prompt based on options
    let enhancedPrompt = prompt.trim();
    
    // Apply style modifiers
    const modifiers = [];
    if (options.highQuality) {
      modifiers.push('high quality', 'detailed', '8k resolution', 'masterpiece');
    }
    if (options.noComposition) {
      modifiers.push('simple composition', 'minimal composition');
    }
    if (!options.noStyle) {
      modifiers.push('artistic style');
    }
    if (!options.noLighting) {
      modifiers.push('professional lighting', 'cinematic lighting');
    }
    if (!options.noColor) {
      modifiers.push('vibrant colors', 'rich colors');
    }

    if (modifiers.length > 0) {
      enhancedPrompt += ', ' + modifiers.join(', ');
    }

    // Add negative prompt if specified
    if (options.negativePrompt) {
      enhancedPrompt += '. NOT: low quality, blurry, distorted, ugly, deformed, bad anatomy';
    }

    console.log(`📝 Enhanced prompt: "${enhancedPrompt}"`);

    // Generate images using AI provider
    // For now, we'll generate one image and duplicate it, but in the future this should generate multiple unique images
    const results = [];
    const totalCost = 0;
    let provider = '';
    let model = '';

    try {
      // Generate the first image
      const generationResult = await aiProviderManager.generateImage({
        inputImageUrl: '', // Empty for text-to-image
        style: 'custom', // Use custom style
        customPrompt: enhancedPrompt,
        sessionId: `txt2img-${Date.now()}`,
      });

      if (generationResult.success && generationResult.generatedImageUrl) {
        provider = generationResult.provider;
        model = generationResult.model;
        
        // For now, return the same image multiple times
        // In a real implementation, you'd generate multiple unique images
        for (let i = 0; i < count; i++) {
          results.push(generationResult.generatedImageUrl);
        }

        console.log(`✅ Text-to-image generation completed successfully`);
        console.log(`🖼️ Generated ${results.length} images`);
        console.log(`⚡ Provider: ${provider} (${model})`);
        console.log(`💰 Total cost: $${totalCost}`);
        console.log(`⏱️ Processing time: ${Date.now() - startTime}ms`);

        return res.status(200).json({
          success: true,
          data: {
            generatedImages: results,
            provider,
            model,
            totalCost,
            processingTimeMs: Date.now() - startTime,
            generatedAt: new Date().toISOString(),
          }
        });
      } else {
        console.error(`❌ AI generation failed:`, generationResult.error);
        return res.status(500).json({
          success: false,
          error: generationResult.error || 'AI generation failed'
        });
      }
    } catch (aiError) {
      console.error(`❌ AI provider error:`, aiError);
      return res.status(500).json({
        success: false,
        error: aiError instanceof Error ? aiError.message : 'AI generation failed'
      });
    }

  } catch (error) {
    console.error('❌ Text-to-image generation error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}