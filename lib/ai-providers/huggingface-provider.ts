import {
  BaseAIProvider,
  AIGenerationRequest,
  AIGenerationResponse,
  AIProviderConfig,
} from "./base-provider";
import { CloudflareR2Storage } from "../storage/cloudflare-r2";

export class HuggingFaceProvider extends BaseAIProvider {
  private apiKey: string;
  private baseUrl = "https://api-inference.huggingface.co/models";
  private storage: CloudflareR2Storage;

  // Using Stable Diffusion for text-to-image (simplifying for now)
  private model = "runwayml/stable-diffusion-v1-5";

  constructor() {
    const config: AIProviderConfig = {
      tier: {
        name: "free",
        displayName: "Free Tier (Hugging Face)",
        costPerImage: 0, // Free tier
        estimatedSpeedSeconds: 15, // May vary due to cold starts
        priority: 0, // Highest priority
        enabled: true,
        description:
          "Free image-to-image transformation via Hugging Face Inference API",
      },
      maxRetries: 3,
      timeoutMs: 120000, // 2 minutes timeout (HF can be slow on free tier)
      rateLimitPerMinute: 30, // Conservative for free tier
    };

    super(config);
    this.apiKey = process.env.HUGGING_FACE_API_KEY || "";
    this.storage = new CloudflareR2Storage();
  }

  get providerName(): string {
    return "huggingface-img2img";
  }

  get supportedStyles(): string[] {
    return ["ghibli", "dragonball", "pixel", "oil", "cartoon"];
  }

  async generateImage(
    request: AIGenerationRequest
  ): Promise<AIGenerationResponse> {
    const startTime = Date.now();

    try {
      console.log(
        `🤗 Starting HuggingFace text-to-image generation with style: ${request.style}`
      );

      const prompt = this.buildPrompt(request.style, request.customPrompt);

      console.log(
        `📤 Generating image with HuggingFace Stable Diffusion: ${prompt.substring(
          0,
          100
        )}...`
      );

      // Prepare the request payload for text-to-image (simplified format)
      const payload = {
        inputs: prompt,
        parameters: {
          negative_prompt: "low quality, blurry, distorted",
          num_inference_steps: 25,
          guidance_scale: 7.5,
          width: 512,
          height: 512,
        },
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ HuggingFace API error (${response.status}):`,
          errorText
        );

        // Handle specific HF errors
        if (response.status === 503) {
          return {
            success: false,
            error: "Model is loading, please try again in a few minutes",
            provider: this.providerName,
            model: this.model,
            processingTimeMs: Date.now() - startTime,
            cost: 0,
          };
        }

        return {
          success: false,
          error: `HuggingFace API error: ${response.status} ${errorText}`,
          provider: this.providerName,
          model: this.model,
          processingTimeMs: Date.now() - startTime,
          cost: 0,
        };
      }

      // Get the generated image
      const generatedImageBuffer = Buffer.from(await response.arrayBuffer());

      if (generatedImageBuffer.length === 0) {
        return {
          success: false,
          error: "Generated image is empty",
          provider: this.providerName,
          model: this.model,
          processingTimeMs: Date.now() - startTime,
          cost: 0,
        };
      }

      // Store the generated image in R2
      const sessionId = request.sessionId || `hf-${Date.now()}`;
      const fileName = "generated.jpg";

      console.log(`💾 Storing generated image in R2...`);

      const fileKey = await this.storage.uploadFile(
        sessionId,
        fileName,
        generatedImageBuffer,
        "image/jpeg"
      );

      const generatedImageUrl = await this.storage.getFileUrl(fileKey);

      console.log(`✅ HuggingFace generation complete: ${generatedImageUrl}`);

      return {
        success: true,
        generatedImageUrl,
        provider: this.providerName,
        model: this.model,
        processingTimeMs: Date.now() - startTime,
        cost: 0, // Free tier
      };
    } catch (error) {
      console.error("❌ HuggingFace generation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        provider: this.providerName,
        model: this.model,
        processingTimeMs: Date.now() - startTime,
        cost: 0,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    // HuggingFace API doesn't require API key for some models, but having one is better
    if (!this.apiKey) {
      console.log(
        "⚠️ HuggingFace API key not set, using anonymous access (rate limited)"
      );
    }

    try {
      // Test the API with a simple request
      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: "GET",
        headers: this.apiKey
          ? {
              Authorization: `Bearer ${this.apiKey}`,
            }
          : {},
        // timeout: 10000,
      });

      const available = response.status !== 404;
      console.log(
        `🔍 HuggingFace provider health check: ${
          available ? "healthy" : "unhealthy"
        } (status: ${response.status})`
      );
      return available;
    } catch (error) {
      console.log("❌ HuggingFace provider health check failed:", error);
      return false;
    }
  }

  /**
   * Fetch the input image from the provided URL
   */
  private async getInputImage(imageUrl: string): Promise<Buffer | null> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error(`Failed to fetch input image: ${response.status}`);
        return null;
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error("Error fetching input image:", error);
      return null;
    }
  }
}
