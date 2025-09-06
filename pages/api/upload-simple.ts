import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { CloudflareR2Storage } from "../../lib/storage/cloudflare-r2";
import { validateFile, generateSessionId } from "../../lib/utils/file-utils";

const storage = new CloudflareR2Storage();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880"), // 5MB default
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

// Helper to run multer middleware
function runMiddleware(req: any, res: any, fn: any): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false,
      error: "Method not allowed" 
    });
  }

  try {
    console.log("🚀 Simple R2 upload starting...");

    // Handle multipart upload
    const uploadMiddleware = upload.single("file");
    await runMiddleware(req, res, uploadMiddleware);

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please select a file."
      });
    }

    console.log(`📁 File received: ${file.originalname} (${file.size} bytes)`);

    // Validate the uploaded file
    const fileInfo = {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      buffer: file.buffer,
    };

    const validationResult = validateFile(fileInfo);
    if (!validationResult.isValid) {
      console.error("❌ File validation failed:", validationResult.error);
      return res.status(400).json({
        success: false,
        error: validationResult.error
      });
    }

    console.log("✅ File validation passed");

    // Generate session ID and upload to R2
    const sessionId = generateSessionId();
    const fileName = "input.jpg"; // Standardize input filename
    
    console.log(`☁️ Uploading to R2 - Session: ${sessionId}`);
    
    const fileKey = await storage.uploadFile(
      sessionId,
      fileName,
      file.buffer,
      file.mimetype
    );

    console.log(`✅ File uploaded to R2: ${fileKey}`);

    // Get the public URL for the uploaded file
    const fileUrl = await storage.getFileUrl(fileKey);

    console.log(`🌐 File URL: ${fileUrl}`);

    // Return success response with session info
    res.status(200).json({
      success: true,
      data: {
        sessionId: sessionId,
        fileKey: fileKey,
        fileUrl: fileUrl,
        originalName: file.originalname,
        fileName: fileName,
        fileSize: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        usage: {
          remaining_generations: 5, // Mock usage for now
        }
      },
      message: "File uploaded successfully to R2"
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    
    // Handle specific multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: "File too large. Maximum size is 5MB."
        });
      }
      return res.status(400).json({
        success: false,
        error: `Upload error: ${error.message}`
      });
    }

    // Handle validation errors
    if (error instanceof Error && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Handle R2 errors
    if (error instanceof Error && error.message.includes('AWS')) {
      return res.status(500).json({
        success: false,
        error: "R2 storage temporarily unavailable"
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : "Unknown error")
        : "Upload failed. Please try again."
    });
  }
}

// Disable default Next.js body parser to handle multipart data
export const config = {
  api: {
    bodyParser: false,
  },
};