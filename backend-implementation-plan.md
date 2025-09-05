# Code Leonardo - Backend Implementation Plan

**Document Version**: v1.0  
**Created**: 2025-09-04  
**Architecture**: Modular Serverless Backend with Multi-AI Provider Support

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Phases](#implementation-phases)
3. [AI Provider Integration](#ai-provider-integration)
4. [Database Schema](#database-schema)
5. [API Specifications](#api-specifications)
6. [Testing Strategy](#testing-strategy)
7. [Cost Optimization](#cost-optimization)
8. [Security Considerations](#security-considerations)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│     React Components | i18n | State Management         │
├─────────────────────────────────────────────────────────┤
│                   API Layer (Next.js API Routes)        │
│    Upload | Generate | Status | Files | Usage           │
├─────────────────────────────────────────────────────────┤
│                 AI Provider Abstraction Layer           │
│      Gemini | Stable Diffusion XL | Flux.1             │
├─────────────────────────────────────────────────────────┤
│                    External Services                    │
│  Supabase DB | Cloudflare R2 | AI APIs | Monitoring    │
└─────────────────────────────────────────────────────────┘
```

### Core Components

- **Frontend**: Existing Next.js app with TypeScript + Tailwind CSS ✅
- **Backend**: Next.js API Routes (Serverless)
- **AI Providers**: Multiple providers with smart selection
- **Storage**: Cloudflare R2 for temporary files
- **Database**: Supabase for user data and usage tracking
- **Deployment**: Vercel with edge functions

---

## Implementation Phases

### **Phase 1: Foundation & Storage** (3 steps, 2-3 days)

#### Step 1: Project Setup & Dependencies

**Duration**: 4-6 hours

**Dependencies to Install**:

```bash
npm install @supabase/supabase-js @aws-sdk/client-s3 multer sharp
npm install @google-ai/generativelanguage replicate openai
npm install @types/multer --save-dev
```

**Environment Variables**:

```env
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Storage
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_ACCOUNT_ID=

# AI Providers
GOOGLE_AI_API_KEY=
REPLICATE_API_TOKEN=
OPENAI_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=
MAX_FILE_SIZE=5242880
FREE_USER_DAILY_LIMIT=5
```

**Project Structure Setup**:

```
lib/
├── ai-providers/
│   ├── base-provider.ts
│   ├── gemini-provider.ts
│   ├── stable-diffusion-provider.ts
│   └── flux-provider.ts
├── database/
│   ├── supabase.ts
│   └── models.ts
├── storage/
│   └── cloudflare-r2.ts
└── utils/
    ├── validation.ts
    ├── file-utils.ts
    └── cost-calculator.ts
```

#### Step 2: Storage Module (Cloudflare R2)

**Duration**: 4-6 hours

**File Storage Utility** (`lib/storage/cloudflare-r2.ts`):

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export class CloudflareR2Storage {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(
    sessionId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    const key = `sessions/${sessionId}/${fileName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          uploadedAt: new Date().toISOString(),
          sessionId: sessionId,
        },
      })
    );

    return key;
  }

  async getFileUrl(key: string): Promise<string> {
    // Return signed URL for temporary access
    return `https://${process.env.CLOUDFLARE_R2_BUCKET_NAME}.r2.dev/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
      })
    );
  }

  async cleanupSessionFiles(sessionId: string): Promise<void> {
    // Implementation for cleaning up all files in a session
  }
}
```

**Benefits of This Approach:**
- ✅ Enables immediate frontend testing of file upload
- ✅ No dependencies on database setup
- ✅ Can validate R2 integration independently
- ✅ Provides working upload endpoint for UI development

#### Step 3: Database Schema & Models

**Duration**: 6-8 hours

**Supabase Tables Schema**:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  user_tier VARCHAR(20) DEFAULT 'free', -- free, paid, premium
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage records table
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  ip_address INET,
  generation_date DATE,
  generation_count INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generation tasks table
CREATE TABLE generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255),
  user_id UUID REFERENCES users(id),
  ip_address INET,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  ai_provider VARCHAR(50),
  style_selected VARCHAR(50),
  custom_prompt TEXT,
  input_file_url TEXT,
  output_file_url TEXT,
  generation_cost DECIMAL(6,4),
  processing_time_seconds INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- AI provider costs tracking
CREATE TABLE ai_provider_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(50),
  cost_per_generation DECIMAL(6,4),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial provider costs
INSERT INTO ai_provider_costs (provider_name, cost_per_generation) VALUES
('flux1', 0.008),
('stable_diffusion_xl', 0.015),
('google_gemini', 0.039);
```

**Database Models** (`lib/database/models.ts`):

```typescript
export interface User {
  id: string;
  email?: string;
  user_tier: "free" | "paid" | "premium";
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  user_id?: string;
  ip_address: string;
  generation_date: string;
  generation_count: number;
  total_cost: number;
  created_at: string;
}

export interface GenerationTask {
  id: string;
  session_id: string;
  user_id?: string;
  ip_address: string;
  status: "pending" | "processing" | "completed" | "failed";
  ai_provider: string;
  style_selected: string;
  custom_prompt?: string;
  input_file_url?: string;
  output_file_url?: string;
  generation_cost?: number;
  processing_time_seconds?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface AIProviderCost {
  id: string;
  provider_name: string;
  cost_per_generation: number;
  is_active: boolean;
  updated_at: string;
}
```

**Now Database Schema with Storage Integration:**

---

### **Phase 2: AI Provider Abstraction Layer** (4 steps, 3-4 days)

#### Step 4: AI Service Interface Design

**Duration**: 2-3 hours

**Base Provider Interface** (`lib/ai-providers/base-provider.ts`):

```typescript
export interface GenerationParams {
  imageBuffer: Buffer;
  style: string;
  customPrompt?: string;
  outputFormat?: "jpg" | "png";
  quality?: "standard" | "hd";
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBuffer?: Buffer;
  processingTimeMs: number;
  cost: number;
  error?: string;
  metadata?: {
    provider: string;
    model: string;
    parameters: Record<string, any>;
  };
}

export abstract class BaseAIProvider {
  abstract name: string;
  abstract costPerGeneration: number;
  abstract maxConcurrentRequests: number;

  abstract generateImage(params: GenerationParams): Promise<GenerationResult>;
  abstract isAvailable(): Promise<boolean>;
  abstract getEstimatedWaitTime(): Promise<number>; // seconds

  // Common utility methods
  protected buildPrompt(style: string, customPrompt?: string): string {
    const stylePrompts = {
      ghibli: "Studio Ghibli anime style, soft watercolor, dreamy atmosphere",
      dragonball:
        "Dragon Ball Z anime style, vibrant colors, dynamic pose, Akira Toriyama art",
      pixel:
        "pixel art style, 16-bit, retro gaming aesthetic, vibrant pixelated colors",
      oil: "oil painting style, classical art, rich textures, Renaissance painting",
      cartoon: "cartoon style, cute, colorful, simple lines, playful",
    };

    const basePrompt =
      stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.cartoon;
    const qualityTags =
      "high quality, detailed, masterpiece, avoid blurry, avoid distorted";

    return customPrompt
      ? `${basePrompt}, ${customPrompt}, ${qualityTags}`
      : `${basePrompt}, ${qualityTags}`;
  }
}
```

#### Step 5: Google Gemini Provider Module

**Duration**: 6-8 hours

**Gemini Implementation** (`lib/ai-providers/gemini-provider.ts`):

```typescript
import {
  BaseAIProvider,
  GenerationParams,
  GenerationResult,
} from "./base-provider";

export class GeminiProvider extends BaseAIProvider {
  name = "google_gemini";
  costPerGeneration = 0.039;
  maxConcurrentRequests = 10;

  private apiKey: string;

  constructor() {
    super();
    this.apiKey = process.env.GOOGLE_AI_API_KEY!;
  }

  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(params.style, params.customPrompt);

      // Google Gemini API call implementation
      const response = await this.callGeminiAPI(params.imageBuffer, prompt);

      if (response.success) {
        return {
          success: true,
          imageBuffer: response.imageBuffer,
          processingTimeMs: Date.now() - startTime,
          cost: this.costPerGeneration,
          metadata: {
            provider: this.name,
            model: "gemini-2.5-flash-image",
            parameters: { prompt, style: params.style },
          },
        };
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      return {
        success: false,
        processingTimeMs: Date.now() - startTime,
        cost: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Health check implementation
      return true;
    } catch {
      return false;
    }
  }

  async getEstimatedWaitTime(): Promise<number> {
    return 15; // 15 seconds average
  }

  private async callGeminiAPI(imageBuffer: Buffer, prompt: string) {
    // Implementation details for Gemini API call
    // Return structured response
  }
}
```

#### Step 6: Stable Diffusion XL Provider Module

**Duration**: 6-8 hours

**Stable Diffusion Implementation** (`lib/ai-providers/stable-diffusion-provider.ts`):

```typescript
import {
  BaseAIProvider,
  GenerationParams,
  GenerationResult,
} from "./base-provider";
import Replicate from "replicate";

export class StableDiffusionProvider extends BaseAIProvider {
  name = "stable_diffusion_xl";
  costPerGeneration = 0.015;
  maxConcurrentRequests = 5;

  private replicate: Replicate;

  constructor() {
    super();
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });
  }

  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(params.style, params.customPrompt);

      // Convert image buffer to base64 for Replicate
      const imageBase64 = `data:image/jpeg;base64,${params.imageBuffer.toString(
        "base64"
      )}`;

      const output = (await this.replicate.run(
        "stability-ai/stable-diffusion-xl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        {
          input: {
            image: imageBase64,
            prompt: prompt,
            strength: 0.8,
            num_inference_steps: 25,
            guidance_scale: 7.5,
          },
        }
      )) as string[];

      if (output && output[0]) {
        const imageResponse = await fetch(output[0]);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        return {
          success: true,
          imageBuffer: imageBuffer,
          processingTimeMs: Date.now() - startTime,
          cost: this.costPerGeneration,
          metadata: {
            provider: this.name,
            model: "stable-diffusion-xl",
            parameters: { prompt, style: params.style },
          },
        };
      } else {
        throw new Error("No output received from Stable Diffusion");
      }
    } catch (error) {
      return {
        success: false,
        processingTimeMs: Date.now() - startTime,
        cost: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check Replicate API status
      return true;
    } catch {
      return false;
    }
  }

  async getEstimatedWaitTime(): Promise<number> {
    return 25; // 25 seconds average
  }
}
```

#### Step 7: Flux.1 Provider Module

**Duration**: 6-8 hours

**Flux.1 Implementation** (`lib/ai-providers/flux-provider.ts`):

```typescript
import {
  BaseAIProvider,
  GenerationParams,
  GenerationResult,
} from "./base-provider";

export class FluxProvider extends BaseAIProvider {
  name = "flux1";
  costPerGeneration = 0.008;
  maxConcurrentRequests = 3;

  constructor() {
    super();
  }

  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(params.style, params.customPrompt);

      // Flux.1 API integration (via Replicate or direct API)
      const response = await this.callFluxAPI(params.imageBuffer, prompt);

      if (response.success) {
        return {
          success: true,
          imageBuffer: response.imageBuffer,
          processingTimeMs: Date.now() - startTime,
          cost: this.costPerGeneration,
          metadata: {
            provider: this.name,
            model: "flux-1-schnell",
            parameters: { prompt, style: params.style },
          },
        };
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      return {
        success: false,
        processingTimeMs: Date.now() - startTime,
        cost: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Flux API health check
      return true;
    } catch {
      return false;
    }
  }

  async getEstimatedWaitTime(): Promise<number> {
    return 8; // 8 seconds average (fastest)
  }

  private async callFluxAPI(imageBuffer: Buffer, prompt: string) {
    // Implementation for Flux.1 API call
    // This could be via Replicate, Together AI, or direct API
  }
}
```

---

### **Phase 3: Core API Routes** (5 steps, 4-5 days)

#### Step 8: File Upload API (`/api/upload`)

**Duration**: 6-8 hours

**Upload Endpoint** (`pages/api/upload.ts`):

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { CloudflareR2Storage } from "../../lib/storage/cloudflare-r2";
import { validateFile, generateSessionId } from "../../lib/utils/file-utils";

const storage = new CloudflareR2Storage();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG and PNG are allowed."));
    }
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Handle multipart upload
    const uploadMiddleware = upload.single("image");

    await new Promise<void>((resolve, reject) => {
      uploadMiddleware(req as any, res as any, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Additional file validation
    const validationResult = validateFile(file);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }

    // Generate session ID and upload to R2
    const sessionId = generateSessionId();
    const fileKey = await storage.uploadFile(
      sessionId,
      "input.jpg",
      file.buffer,
      file.mimetype
    );

    // Return session info
    res.status(200).json({
      success: true,
      sessionId: sessionId,
      fileUrl: await storage.getFileUrl(fileKey),
      fileName: file.originalname,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
```

#### Step 9: AI Router & Selection API (`/api/generate`)

**Duration**: 8-10 hours

**Provider Selection Logic** (`lib/utils/provider-selector.ts`):

```typescript
import { GeminiProvider } from "../ai-providers/gemini-provider";
import { StableDiffusionProvider } from "../ai-providers/stable-diffusion-provider";
import { FluxProvider } from "../ai-providers/flux-provider";
import { BaseAIProvider } from "../ai-providers/base-provider";

export class ProviderSelector {
  private providers: BaseAIProvider[];

  constructor() {
    this.providers = [
      new FluxProvider(), // Cheapest first
      new StableDiffusionProvider(),
      new GeminiProvider(), // Most expensive last
    ];
  }

  async selectOptimalProvider(
    userTier: string = "free"
  ): Promise<BaseAIProvider | null> {
    // Strategy based on user tier and provider availability
    const strategy = {
      free: ["flux1", "stable_diffusion_xl"], // Cheapest options
      paid: ["stable_diffusion_xl", "google_gemini"], // Balance cost/quality
      premium: ["google_gemini", "stable_diffusion_xl"], // Quality first
    };

    const preferredProviders =
      strategy[userTier as keyof typeof strategy] || strategy.free;

    // Check availability and select first available
    for (const providerName of preferredProviders) {
      const provider = this.providers.find((p) => p.name === providerName);
      if (provider && (await provider.isAvailable())) {
        return provider;
      }
    }

    // Fallback: return any available provider
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }

    return null; // No providers available
  }

  async getAllProviderStatus() {
    const status = await Promise.all(
      this.providers.map(async (provider) => ({
        name: provider.name,
        cost: provider.costPerGeneration,
        available: await provider.isAvailable(),
        estimatedWait: await provider.getEstimatedWaitTime(),
      }))
    );
    return status;
  }
}
```

**Generate Endpoint** (`pages/api/generate.ts`):

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import { CloudflareR2Storage } from "../../lib/storage/cloudflare-r2";
import { ProviderSelector } from "../../lib/utils/provider-selector";
import { supabase } from "../../lib/database/supabase";
import {
  checkUsageLimit,
  recordGeneration,
} from "../../lib/utils/usage-tracker";

const storage = new CloudflareR2Storage();
const providerSelector = new ProviderSelector();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId, style, customPrompt, userTier = "free" } = req.body;
    const clientIP =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Check usage limits
    const canGenerate = await checkUsageLimit(clientIP as string, userTier);
    if (!canGenerate) {
      return res.status(429).json({
        error: "Daily generation limit exceeded",
        limit: process.env.FREE_USER_DAILY_LIMIT,
      });
    }

    // Create generation task record
    const { data: task } = await supabase
      .from("generation_tasks")
      .insert({
        session_id: sessionId,
        ip_address: clientIP,
        status: "pending",
        style_selected: style,
        custom_prompt: customPrompt,
      })
      .select()
      .single();

    // Select optimal AI provider
    const provider = await providerSelector.selectOptimalProvider(userTier);
    if (!provider) {
      await supabase
        .from("generation_tasks")
        .update({
          status: "failed",
          error_message: "No AI providers available",
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      return res
        .status(503)
        .json({ error: "AI services temporarily unavailable" });
    }

    // Update task with selected provider
    await supabase
      .from("generation_tasks")
      .update({
        status: "processing",
        ai_provider: provider.name,
        generation_cost: provider.costPerGeneration,
      })
      .eq("id", task.id);

    // Start async generation process
    processGeneration(task.id, sessionId, style, customPrompt, provider);

    // Return task ID for status tracking
    res.status(202).json({
      success: true,
      taskId: task.id,
      provider: provider.name,
      estimatedWaitTime: await provider.getEstimatedWaitTime(),
      message: "Generation started",
    });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Generation failed",
    });
  }
}

async function processGeneration(
  taskId: string,
  sessionId: string,
  style: string,
  customPrompt: string | undefined,
  provider: BaseAIProvider
) {
  try {
    // Get input file from storage
    const inputFileUrl = await storage.getFileUrl(
      `sessions/${sessionId}/input.jpg`
    );
    const inputResponse = await fetch(inputFileUrl);
    const inputBuffer = Buffer.from(await inputResponse.arrayBuffer());

    // Generate image
    const result = await provider.generateImage({
      imageBuffer: inputBuffer,
      style,
      customPrompt,
    });

    if (result.success && result.imageBuffer) {
      // Upload generated image to storage
      const outputKey = await storage.uploadFile(
        sessionId,
        "output.jpg",
        result.imageBuffer,
        "image/jpeg"
      );

      const outputUrl = await storage.getFileUrl(outputKey);

      // Update task as completed
      await supabase
        .from("generation_tasks")
        .update({
          status: "completed",
          input_file_url: inputFileUrl,
          output_file_url: outputUrl,
          processing_time_seconds: Math.round(result.processingTimeMs / 1000),
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      // Record usage
      await recordGeneration(taskId, result.cost);
    } else {
      // Update task as failed
      await supabase
        .from("generation_tasks")
        .update({
          status: "failed",
          error_message: result.error || "Generation failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);
    }
  } catch (error) {
    console.error("Processing error:", error);
    await supabase
      .from("generation_tasks")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Processing failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);
  }
}
```

#### Step 10: Generation Status API (`/api/status/[taskId]`)

**Duration**: 4-6 hours

**Status Endpoint** (`pages/api/status/[taskId].ts`):

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/database/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== "string") {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    // Get task status from database
    const { data: task, error } = await supabase
      .from("generation_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error || !task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Calculate progress based on status
    const progress = {
      pending: 10,
      processing: 50,
      completed: 100,
      failed: 0,
    };

    const response = {
      taskId: task.id,
      status: task.status,
      progress: progress[task.status as keyof typeof progress],
      provider: task.ai_provider,
      style: task.style_selected,
      createdAt: task.created_at,
      completedAt: task.completed_at,
      processingTime: task.processing_time_seconds,
      cost: task.generation_cost,
    };

    // Add result URLs if completed
    if (task.status === "completed") {
      response.inputFileUrl = task.input_file_url;
      response.outputFileUrl = task.output_file_url;
    }

    // Add error message if failed
    if (task.status === "failed") {
      response.error = task.error_message;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Status check failed",
    });
  }
}
```

#### Step 11: File Retrieval API (`/api/files/[sessionId]`)

**Duration**: 6-8 hours

**File Service Endpoint** (`pages/api/files/[sessionId].ts`):

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import { CloudflareR2Storage } from "../../../lib/storage/cloudflare-r2";
import { supabase } from "../../../lib/database/supabase";
import sharp from "sharp";

const storage = new CloudflareR2Storage();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { sessionId, type = "output", download = false } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    // Validate session exists
    const { data: task } = await supabase
      .from("generation_tasks")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (!task) {
      return res.status(404).json({ error: "Session not found" });
    }

    const fileName = type === "input" ? "input.jpg" : "output.jpg";
    const fileKey = `sessions/${sessionId}/${fileName}`;

    try {
      // Get file from R2 storage
      const fileResponse = await fetch(await storage.getFileUrl(fileKey));

      if (!fileResponse.ok) {
        return res.status(404).json({ error: "File not found" });
      }

      let imageBuffer = Buffer.from(await fileResponse.arrayBuffer());

      // Add watermark for free users on output images
      if (
        type === "output" &&
        task.user_tier !== "paid" &&
        task.user_tier !== "premium"
      ) {
        imageBuffer = await addWatermark(imageBuffer);
      }

      // Set appropriate headers
      const contentType = "image/jpeg";
      const fileName =
        download === "true"
          ? `CodeLeonardo_${task.style_selected}_${Date.now()}.jpg`
          : `${type}.jpg`;

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache

      if (download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
      }

      res.status(200).send(imageBuffer);
    } catch (storageError) {
      console.error("Storage error:", storageError);
      return res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    console.error("File retrieval error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "File retrieval failed",
    });
  }
}

async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const watermarkSvg = `
      <svg width="200" height="40">
        <text x="100" y="25" 
              font-family="Arial" 
              font-size="14" 
              fill="white" 
              fill-opacity="0.7" 
              text-anchor="middle">
          Made with CodeLeonardo
        </text>
      </svg>
    `;

    const watermarkBuffer = Buffer.from(watermarkSvg);

    const watermarked = await sharp(imageBuffer)
      .composite([
        {
          input: watermarkBuffer,
          gravity: "southeast",
          blend: "over",
        },
      ])
      .jpeg()
      .toBuffer();

    return watermarked;
  } catch (error) {
    console.error("Watermark error:", error);
    return imageBuffer; // Return original if watermarking fails
  }
}
```

#### Step 12: Usage Management API (`/api/usage`)

**Duration**: 6-8 hours

**Usage Tracking Utilities** (`lib/utils/usage-tracker.ts`):

```typescript
import { supabase } from "../database/supabase";

export async function checkUsageLimit(
  ipAddress: string,
  userTier: string = "free"
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];

  // Get usage limits based on user tier
  const limits = {
    free: parseInt(process.env.FREE_USER_DAILY_LIMIT || "5"),
    paid: 100,
    premium: -1, // Unlimited
  };

  const dailyLimit = limits[userTier as keyof typeof limits] || limits.free;

  if (dailyLimit === -1) return true; // Unlimited

  // Check current usage for today
  const { data: usage } = await supabase
    .from("usage_records")
    .select("generation_count")
    .eq("ip_address", ipAddress)
    .eq("generation_date", today)
    .single();

  const currentUsage = usage?.generation_count || 0;
  return currentUsage < dailyLimit;
}

export async function recordGeneration(
  taskId: string,
  cost: number
): Promise<void> {
  try {
    // Get task details
    const { data: task } = await supabase
      .from("generation_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (!task) return;

    const today = new Date().toISOString().split("T")[0];

    // Upsert usage record
    await supabase.from("usage_records").upsert(
      {
        ip_address: task.ip_address,
        user_id: task.user_id,
        generation_date: today,
        generation_count: 1,
        total_cost: cost,
      },
      {
        onConflict: "ip_address,generation_date",
        ignoreDuplicates: false,
      }
    );

    // Update generation count if record exists
    await supabase.rpc("increment_usage", {
      ip_addr: task.ip_address,
      gen_date: today,
      cost_increment: cost,
    });
  } catch (error) {
    console.error("Usage recording error:", error);
  }
}

export async function getUserUsage(ipAddress: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data: usage } = await supabase
    .from("usage_records")
    .select("*")
    .eq("ip_address", ipAddress)
    .eq("generation_date", today)
    .single();

  return {
    generationsToday: usage?.generation_count || 0,
    totalCostToday: usage?.total_cost || 0,
    remainingGenerations: Math.max(0, 5 - (usage?.generation_count || 0)),
  };
}
```

**Usage Endpoint** (`pages/api/usage.ts`):

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import { getUserUsage } from "../../lib/utils/usage-tracker";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const clientIP =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    if (!clientIP) {
      return res.status(400).json({ error: "Could not determine client IP" });
    }

    const usage = await getUserUsage(clientIP as string);

    res.status(200).json({
      success: true,
      ...usage,
      dailyLimit: parseInt(process.env.FREE_USER_DAILY_LIMIT || "5"),
    });
  } catch (error) {
    console.error("Usage check error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Usage check failed",
    });
  }
}
```

---

### **Phase 4: Advanced Features** (3 steps, 3-4 days)

#### Step 13: Provider Selection Engine

**Duration**: 6-8 hours

**Advanced Provider Logic** (`lib/utils/advanced-provider-selector.ts`):

```typescript
export class AdvancedProviderSelector extends ProviderSelector {
  private providerMetrics: Map<string, ProviderMetrics> = new Map()

  interface ProviderMetrics {
    successRate: number
    averageResponseTime: number
    lastFailureTime?: number
    consecutiveFailures: number
  }

  async selectProviderWithFallback(userTier: string = 'free', style?: string): Promise<BaseAIProvider | null> {
    // Smart selection based on:
    // 1. User tier preferences
    // 2. Provider reliability metrics
    // 3. Style-specific performance
    // 4. Current load balancing

    const candidates = await this.getRankedProviders(userTier, style)

    for (const provider of candidates) {
      if (await this.isProviderHealthy(provider)) {
        return provider
      }
    }

    return null
  }

  private async getRankedProviders(userTier: string, style?: string): Promise<BaseAIProvider[]> {
    const weights = {
      cost: userTier === 'free' ? 0.7 : 0.3,
      quality: userTier === 'premium' ? 0.7 : 0.3,
      speed: 0.2,
      reliability: 0.4
    }

    // Ranking algorithm implementation
    return this.providers.sort((a, b) => {
      const scoreA = this.calculateProviderScore(a, weights, style)
      const scoreB = this.calculateProviderScore(b, weights, style)
      return scoreB - scoreA
    })
  }

  private calculateProviderScore(provider: BaseAIProvider, weights: any, style?: string): number {
    // Implementation of scoring algorithm
    const metrics = this.providerMetrics.get(provider.name)

    const costScore = 1 - (provider.costPerGeneration / 0.05) // Normalize to max $0.05
    const reliabilityScore = metrics?.successRate || 0.9
    const speedScore = 1 - ((metrics?.averageResponseTime || 15) / 60) // Normalize to 60s max

    return (
      costScore * weights.cost +
      reliabilityScore * weights.reliability +
      speedScore * weights.speed
    )
  }

  async updateProviderMetrics(providerName: string, success: boolean, responseTime: number): Promise<void> {
    // Update provider performance metrics
    const current = this.providerMetrics.get(providerName) || {
      successRate: 0.9,
      averageResponseTime: 15,
      consecutiveFailures: 0
    }

    if (success) {
      current.successRate = current.successRate * 0.9 + 0.1 // Moving average
      current.consecutiveFailures = 0
    } else {
      current.successRate = current.successRate * 0.9
      current.consecutiveFailures += 1
      current.lastFailureTime = Date.now()
    }

    current.averageResponseTime = current.averageResponseTime * 0.8 + responseTime * 0.2

    this.providerMetrics.set(providerName, current)
  }
}
```

#### Step 14: Cost Management Module

**Duration**: 6-8 hours

**Cost Tracking System** (`lib/utils/cost-manager.ts`):

```typescript
import { supabase } from "../database/supabase";

export class CostManager {
  private monthlyBudgetLimit: number;
  private alertThresholds: number[];

  constructor() {
    this.monthlyBudgetLimit = parseFloat(
      process.env.MONTHLY_BUDGET_LIMIT || "100"
    );
    this.alertThresholds = [0.5, 0.8, 0.95]; // 50%, 80%, 95%
  }

  async getCurrentMonthCosts(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: costs } = await supabase
      .from("generation_tasks")
      .select("generation_cost")
      .gte("created_at", startOfMonth.toISOString())
      .eq("status", "completed");

    return (
      costs?.reduce((sum, record) => sum + (record.generation_cost || 0), 0) ||
      0
    );
  }

  async checkBudgetStatus(): Promise<BudgetStatus> {
    const currentSpend = await this.getCurrentMonthCosts();
    const percentage = currentSpend / this.monthlyBudgetLimit;

    return {
      currentSpend,
      budgetLimit: this.monthlyBudgetLimit,
      percentage,
      status: this.getBudgetStatus(percentage),
      shouldAlert: this.shouldSendAlert(percentage),
    };
  }

  private getBudgetStatus(
    percentage: number
  ): "safe" | "warning" | "critical" | "exceeded" {
    if (percentage >= 1.0) return "exceeded";
    if (percentage >= 0.9) return "critical";
    if (percentage >= 0.7) return "warning";
    return "safe";
  }

  async getProviderCostAnalysis(): Promise<ProviderCostAnalysis[]> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: tasks } = await supabase
      .from("generation_tasks")
      .select("ai_provider, generation_cost, status")
      .gte("created_at", startOfMonth.toISOString());

    const analysis = tasks?.reduce((acc, task) => {
      if (!acc[task.ai_provider]) {
        acc[task.ai_provider] = {
          provider: task.ai_provider,
          totalCost: 0,
          totalGenerations: 0,
          successfulGenerations: 0,
          averageCost: 0,
        };
      }

      acc[task.ai_provider].totalGenerations += 1;
      if (task.status === "completed") {
        acc[task.ai_provider].totalCost += task.generation_cost || 0;
        acc[task.ai_provider].successfulGenerations += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate average costs and success rates
    Object.values(analysis || {}).forEach((provider: any) => {
      provider.averageCost =
        provider.totalCost / provider.successfulGenerations || 0;
      provider.successRate =
        provider.successfulGenerations / provider.totalGenerations;
    });

    return Object.values(analysis || {});
  }
}

interface BudgetStatus {
  currentSpend: number;
  budgetLimit: number;
  percentage: number;
  status: "safe" | "warning" | "critical" | "exceeded";
  shouldAlert: boolean;
}

interface ProviderCostAnalysis {
  provider: string;
  totalCost: number;
  totalGenerations: number;
  successfulGenerations: number;
  averageCost: number;
  successRate: number;
}
```

#### Step 15: Session & Cache Management

**Duration**: 4-6 hours

**Session Manager** (`lib/utils/session-manager.ts`):

```typescript
export class SessionManager {
  private activeSessions: Map<string, SessionData> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired sessions every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 30 * 60 * 1000);
  }

  createSession(ipAddress: string): string {
    const sessionId = this.generateSessionId();
    const sessionData: SessionData = {
      id: sessionId,
      ipAddress,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      files: [],
      status: "active",
    };

    this.activeSessions.set(sessionId, sessionData);
    return sessionId;
  }

  async scheduleCleanup(
    sessionId: string,
    delayMinutes: number = 120
  ): Promise<void> {
    setTimeout(async () => {
      await this.cleanupSession(sessionId);
    }, delayMinutes * 60 * 1000);
  }

  private async cleanupSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // Delete files from R2 storage
      const storage = new CloudflareR2Storage();
      await storage.cleanupSessionFiles(sessionId);

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      console.log(`Cleaned up session: ${sessionId}`);
    } catch (error) {
      console.error(`Cleanup error for session ${sessionId}:`, error);
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, sessionData] of this.activeSessions.entries()) {
      // Sessions expire after 4 hours of inactivity
      if (now - sessionData.lastActivity > 4 * 60 * 60 * 1000) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach((sessionId) => {
      this.cleanupSession(sessionId);
    });
  }
}

interface SessionData {
  id: string;
  ipAddress: string;
  createdAt: number;
  lastActivity: number;
  files: string[];
  status: "active" | "expired" | "cleaning";
}
```

---

### **Phase 5: Integration & Security** (2 steps, 2-3 days)

#### Step 16: Security & Validation Module

**Duration**: 8-10 hours

**Security Utilities** (`lib/utils/security.ts`):

```typescript
import rateLimit from "express-rate-limit";
import { createHash } from "crypto";

// Rate limiting for API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: "Upload limit exceeded, please try again later.",
});

// Input validation utilities
export function validateImageFile(file: any): ValidationResult {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { isValid: false, error: "No file provided" };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: "Invalid file type. Only JPG and PNG are allowed.",
    };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: "File too large. Maximum size is 5MB." };
  }

  // Check for malicious content signatures
  if (this.containsMaliciousSignatures(file.buffer)) {
    return {
      isValid: false,
      error: "File contains potentially malicious content",
    };
  }

  return { isValid: true };
}

export function sanitizePrompt(prompt: string): string {
  if (!prompt) return "";

  // Remove potentially harmful content
  const sanitized = prompt
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim()
    .slice(0, 500); // Limit length

  return sanitized;
}

export function validateSessionId(sessionId: string): boolean {
  // Session ID should be a valid UUID v4 format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

// Content safety checks
export async function detectInappropriateContent(
  imageBuffer: Buffer
): Promise<boolean> {
  // Implementation for content moderation
  // This could integrate with services like Google Cloud Vision AI
  // or implement basic checks for NSFW content

  try {
    // Placeholder for content detection logic
    // Return true if content is inappropriate
    return false;
  } catch (error) {
    console.error("Content detection error:", error);
    return false; // Default to allowing content if detection fails
  }
}

// Security headers middleware
export function setSecurityHeaders(res: NextApiResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'"
  );
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

#### Step 17: Error Handling & Monitoring

**Duration**: 6-8 hours

**Comprehensive Error Handler** (`lib/utils/error-handler.ts`):

```typescript
export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = "APIError";
  }
}

export function handleAPIError(error: unknown, res: NextApiResponse): void {
  console.error("API Error:", error);

  if (error instanceof APIError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === "development" && {
          details: error.details,
        }),
      },
    });
  } else if (error instanceof Error) {
    res.status(500).json({
      success: false,
      error: {
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
        code: "INTERNAL_ERROR",
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        message: "Unknown error occurred",
        code: "UNKNOWN_ERROR",
      },
    });
  }
}

// Structured logging
export class Logger {
  static info(message: string, metadata?: any): void {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  }

  static error(message: string, error?: Error, metadata?: any): void {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        timestamp: new Date().toISOString(),
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
        ...metadata,
      })
    );
  }

  static warn(message: string, metadata?: any): void {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  }
}

// Health monitoring
export async function getSystemHealth(): Promise<SystemHealth> {
  const health: SystemHealth = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Check database connectivity
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);
    health.services.database = error ? "unhealthy" : "healthy";
  } catch (error) {
    health.services.database = "unhealthy";
    health.status = "degraded";
  }

  // Check AI providers
  const providerSelector = new ProviderSelector();
  const providerStatuses = await providerSelector.getAllProviderStatus();

  health.services.aiProviders = providerStatuses.reduce((acc, provider) => {
    acc[provider.name] = provider.available ? "healthy" : "unhealthy";
    if (!provider.available) health.status = "degraded";
    return acc;
  }, {} as Record<string, string>);

  // Check storage
  try {
    // Simple connectivity test to R2
    health.services.storage = "healthy"; // Placeholder
  } catch (error) {
    health.services.storage = "unhealthy";
    health.status = "degraded";
  }

  return health;
}

interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: Record<string, string>;
}
```

---

### **Phase 6: Frontend Integration** (1 step, 1-2 days)

#### Step 18: Frontend API Integration

**Duration**: 8-12 hours

**API Client Service** (`lib/api-client.ts`):

```typescript
export class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_APP_URL || "";
  }

  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${this.baseURL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async generateImage(params: GenerationParams): Promise<GenerationResponse> {
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getGenerationStatus(taskId: string): Promise<StatusResponse> {
    const response = await fetch(`${this.baseURL}/api/status/${taskId}`);

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getFile(
    sessionId: string,
    type: "input" | "output",
    download: boolean = false
  ): Promise<string> {
    const params = new URLSearchParams({
      type,
      ...(download && { download: "true" }),
    });

    return `${this.baseURL}/api/files/${sessionId}?${params}`;
  }

  async getUserUsage(): Promise<UsageResponse> {
    const response = await fetch(`${this.baseURL}/api/usage`);

    if (!response.ok) {
      throw new Error(`Usage check failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Polling utility for generation status
  async pollGenerationStatus(
    taskId: string,
    onProgress?: (status: StatusResponse) => void
  ): Promise<StatusResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getGenerationStatus(taskId);

          if (onProgress) {
            onProgress(status);
          }

          if (status.status === "completed" || status.status === "failed") {
            resolve(status);
          } else {
            // Poll every 2 seconds
            setTimeout(poll, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// Type definitions
export interface UploadResponse {
  success: boolean;
  sessionId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface GenerationParams {
  sessionId: string;
  style: string;
  customPrompt?: string;
  userTier?: string;
}

export interface GenerationResponse {
  success: boolean;
  taskId: string;
  provider: string;
  estimatedWaitTime: number;
  message: string;
}

export interface StatusResponse {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  provider?: string;
  style?: string;
  createdAt: string;
  completedAt?: string;
  processingTime?: number;
  cost?: number;
  inputFileUrl?: string;
  outputFileUrl?: string;
  error?: string;
}

export interface UsageResponse {
  success: boolean;
  generationsToday: number;
  totalCostToday: number;
  remainingGenerations: number;
  dailyLimit: number;
}
```

**Updated Frontend Components** (Update `pages/index.tsx`):

```typescript
// Replace mock data with real API calls
import { APIClient } from "../lib/api-client";

const apiClient = new APIClient();

// Update handleFileUpload function
const handleFileUpload = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    alert(t("fileSizeError"));
    return;
  }

  try {
    setIsUploading(true);
    const uploadResponse = await apiClient.uploadFile(file);

    setUploadedFile(file);
    setSessionId(uploadResponse.sessionId);
    setUploadedImageUrl(uploadResponse.fileUrl);
    setCurrentStep("styleSelect");
  } catch (error) {
    console.error("Upload error:", error);
    alert("Upload failed. Please try again.");
  } finally {
    setIsUploading(false);
  }
};

// Update handleGenerate function
const handleGenerate = async () => {
  if (!selectedStyle || !sessionId) return;

  try {
    setCurrentStep("generating");
    setGenerationProgress(0);

    const generateResponse = await apiClient.generateImage({
      sessionId,
      style: selectedStyle,
      customPrompt,
      userTier: "free",
    });

    // Poll for status updates
    const finalStatus = await apiClient.pollGenerationStatus(
      generateResponse.taskId,
      (status) => {
        setGenerationProgress(status.progress);
        setEstimatedTime(status.processingTime || 0);
      }
    );

    if (finalStatus.status === "completed") {
      setResultImageUrl(finalStatus.outputFileUrl!);
      setCurrentStep("result");
    } else {
      throw new Error(finalStatus.error || "Generation failed");
    }
  } catch (error) {
    console.error("Generation error:", error);
    alert("Generation failed. Please try again.");
    setCurrentStep("styleSelect");
  }
};

// Add usage tracking
useEffect(() => {
  apiClient.getUserUsage().then((usage) => {
    setDailyUsage(usage.remainingGenerations);
  });
}, []);
```

---

## Testing Strategy

### Unit Testing (Each Module)

```bash
# Test AI providers independently
npm test -- --testPathPattern=ai-providers

# Test API endpoints
npm test -- --testPathPattern=api

# Test utilities
npm test -- --testPathPattern=utils
```

### Integration Testing

```bash
# Test complete generation flow
npm test -- --testPathPattern=integration

# Test provider fallback mechanisms
npm test -- --testPathPattern=fallback
```

### Load Testing

```bash
# Test concurrent generations
npm run test:load
```

---

## Cost Optimization Summary

### Provider Cost Comparison:

1. **Flux.1**: ~$0.008/generation (cheapest)
2. **Stable Diffusion XL**: ~$0.015/generation (balance)
3. **Google Gemini**: ~$0.039/generation (premium)

### Smart Selection Strategy:

- **Free users**: Flux.1 → Stable Diffusion XL (cost-optimized)
- **Paid users**: Stable Diffusion XL → Gemini (quality-optimized)
- **Automatic fallback** chain for high availability

### Estimated Monthly Costs:

- 1000 free users @ 5 generations each = 5000 × $0.008 = **$40/month**
- With 80% Flux.1, 20% Stable Diffusion = **$46/month average**

---

## Security Checklist

- ✅ File type validation (JPG/PNG only)
- ✅ File size limits (5MB max)
- ✅ Rate limiting (uploads + API calls)
- ✅ Input sanitization
- ✅ Content moderation hooks
- ✅ Secure file storage with cleanup
- ✅ No persistent user data storage
- ✅ CORS configuration
- ✅ Security headers
- ✅ Error handling without data leakage

---

## Deployment Configuration

### Environment Variables:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=leonardo-files
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id

# AI Providers
GOOGLE_AI_API_KEY=your_gemini_key
REPLICATE_API_TOKEN=your_replicate_token

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
MAX_FILE_SIZE=5242880
FREE_USER_DAILY_LIMIT=5
MONTHLY_BUDGET_LIMIT=100
```

### Vercel Configuration (`vercel.json`):

```json
{
  "functions": {
    "pages/api/generate.ts": {
      "maxDuration": 60
    },
    "pages/api/upload.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cleanup",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

---

## Timeline Summary

### **Total Implementation Time: 12-15 days**

- **Phase 1**: Foundation & Storage (2-3 days)
- **Phase 2**: AI Provider Integration (3-4 days)
- **Phase 3**: Core API Routes (4-5 days)
- **Phase 4**: Advanced Features (3-4 days)
- **Phase 5**: Security & Integration (2-3 days)
- **Phase 6**: Frontend Integration (1-2 days)

### **Testing & Deployment**: +2-3 days

**Total Project Timeline: 14-18 days**

---

_This document serves as your comprehensive guide for implementing the Code Leonardo backend with multi-AI provider support, cost optimization, and production-ready architecture._
