import { NextApiRequest, NextApiResponse } from "next";
import { CloudflareR2Storage } from "../../lib/storage/cloudflare-r2";
import { aiProviderManager } from "../../lib/ai-providers/provider-manager";
import { validateEnvironmentVariables } from "../../lib/utils/validation";
import { styleManager } from "../../utils/styleManager";

const storage = new CloudflareR2Storage();

interface GenerateRequest {
  sessionId: string;
  style: string;
  customPrompt?: string;
  customStylePrompt?: string; // For custom styles
  inputFileName?: string;
}

interface GenerateResponse {
  success: boolean;
  data?: {
    sessionId: string;
    generatedImageUrl: string;
    generatedFileName: string;
    provider: string;
    model: string;
    cost: number;
    processingTimeMs: number;
    style: string;
    generatedAt: string;
  };
  error?: string;
  details?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponse>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false,
      error: "Method not allowed" 
    });
  }

  try {
    // Check environment configuration
    const envErrors = validateEnvironmentVariables();
    if (envErrors.length > 0) {
      console.error("Environment validation failed:", envErrors);
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
        details: process.env.NODE_ENV === 'development' ? envErrors : undefined
      });
    }

    // Validate request body
    const { sessionId, style, customPrompt, customStylePrompt, inputFileName = 'input.jpg' }: GenerateRequest = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required"
      });
    }

    if (!style) {
      return res.status(400).json({
        success: false,
        error: "Style selection is required"
      });
    }

    // Validate style: either predefined or custom
    const isCustomStyle = style.startsWith('custom-');
    if (!isCustomStyle) {
      const supportedStyles = ['ghibli', 'dragonball', 'pixel', 'oil', 'cartoon'];
      if (!supportedStyles.includes(style)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported style: ${style}. Supported styles: ${supportedStyles.join(', ')}`
        });
      }
    } else if (!customStylePrompt) {
      return res.status(400).json({
        success: false,
        error: "Custom style prompt is required for custom styles"
      });
    }

    console.log(`🎨 Starting generation for session ${sessionId}, style: ${style}`);

    // Check if input file exists in the session
    const inputFileKey = `sessions/${sessionId}/${inputFileName}`;
    const inputExists = await storage.fileExists(inputFileKey);
    
    if (!inputExists) {
      return res.status(400).json({
        success: false,
        error: "Input file not found. Please upload an image first."
      });
    }

    // Get the direct R2 URL for external AI providers to access
    const inputImageUrl = await storage.getDirectFileUrl(inputFileKey);
    
    console.log(`📁 Using input image (direct R2 URL): ${inputImageUrl}`);

    // Check system status and get cost estimate
    const systemStatus = await aiProviderManager.getSystemStatus();
    if (systemStatus.healthyProviders === 0) {
      return res.status(503).json({
        success: false,
        error: "AI generation service is temporarily unavailable"
      });
    }

    // For custom styles, use the custom prompt as the style
    const effectiveStyle = isCustomStyle ? 'custom' : style;
    const effectivePrompt = isCustomStyle 
      ? (customPrompt ? `${customStylePrompt}, ${customPrompt}` : customStylePrompt)
      : customPrompt;

    console.log(`🎨 Using style: ${effectiveStyle}, prompt: ${effectivePrompt?.substring(0, 100)}...`);

    // Estimate cost before generation
    const costEstimate = await aiProviderManager.estimateCost({
      inputImageUrl,
      style: effectiveStyle,
      customPrompt: effectivePrompt,
      sessionId
    });

    console.log(`💰 Estimated cost: $${costEstimate.estimatedCost} (${costEstimate.provider})`);

    // Generate the image
    const generationResult = await aiProviderManager.generateImage({
      inputImageUrl,
      style: effectiveStyle,
      customPrompt: effectivePrompt,
      sessionId
    }, {
      preferredTier: 'free', // Always use free tier for now
      maxCost: 0.01, // Max $0.01 per generation
      maxTimeSeconds: 120, // 2 minutes max
      fallbackEnabled: true
    });

    if (!generationResult.success) {
      console.error(`❌ Generation failed for session ${sessionId}:`, generationResult.error);
      return res.status(500).json({
        success: false,
        error: generationResult.error || "Image generation failed"
      });
    }

    if (!generationResult.generatedImageUrl) {
      return res.status(500).json({
        success: false,
        error: "Generated image URL not provided"
      });
    }

    console.log(`✅ Image generated successfully: ${generationResult.generatedImageUrl}`);

    // Download the generated image and store it in our R2 bucket
    const generatedFileName = `generated_${style}_${Date.now()}.png`;
    let storedImageUrl: string;

    try {
      console.log(`📥 Downloading generated image from: ${generationResult.generatedImageUrl}`);
      
      // Download the generated image
      const imageResponse = await fetch(generationResult.generatedImageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      
      console.log(`💾 Storing generated image (${imageBuffer.length} bytes) to session ${sessionId}`);

      // Upload to our R2 storage
      const generatedFileKey = await storage.uploadFile(
        sessionId,
        generatedFileName,
        imageBuffer,
        'image/png'
      );

      // Get the URL through our proxy
      storedImageUrl = await storage.getFileUrl(generatedFileKey);
      
      console.log(`🔗 Generated image accessible at: ${storedImageUrl}`);

    } catch (downloadError) {
      console.error(`❌ Failed to download/store generated image:`, downloadError);
      
      // Fallback: return the original URL directly
      storedImageUrl = generationResult.generatedImageUrl;
      console.warn(`⚠️ Using direct URL as fallback: ${storedImageUrl}`);
    }

    // Return success response
    const response: GenerateResponse = {
      success: true,
      data: {
        sessionId,
        generatedImageUrl: storedImageUrl,
        generatedFileName,
        provider: generationResult.provider,
        model: generationResult.model,
        cost: generationResult.cost,
        processingTimeMs: generationResult.processingTimeMs,
        style,
        generatedAt: new Date().toISOString(),
      }
    };

    console.log(`🎉 Generation completed for session ${sessionId} in ${generationResult.processingTimeMs}ms`);

    res.status(200).json(response);

  } catch (error) {
    console.error("Generation error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // Provider or network errors
      if (error.message.includes('AI providers') || error.message.includes('No suitable')) {
        return res.status(503).json({
          success: false,
          error: "AI generation service is temporarily unavailable"
        });
      }
      
      // Timeout errors
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return res.status(408).json({
          success: false,
          error: "Generation request timed out. Please try again."
        });
      }
      
      // Rate limiting errors
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return res.status(429).json({
          success: false,
          error: "Too many requests. Please wait a moment before trying again."
        });
      }
      
      // Storage errors
      if (error.message.includes('AWS') || error.message.includes('storage')) {
        return res.status(500).json({
          success: false,
          error: "Storage service temporarily unavailable"
        });
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : "Unknown error")
        : "Image generation failed. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

// Export configuration to handle larger payloads if needed
export const config = {
  api: {
    responseLimit: '10mb', // Allow larger responses for image data
  },
};