import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
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
    // Return URL through our API proxy for secure access
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/files/${key}`;
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
    try {
      // List all files in the session directory
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Prefix: `sessions/${sessionId}/`,
      });

      const listResponse = await this.client.send(listCommand);
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Delete each file in the session
        for (const object of listResponse.Contents) {
          if (object.Key) {
            await this.deleteFile(object.Key);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup session files for ${sessionId}:`, error);
      throw error;
    }
  }

  async getFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error("File not found or empty");
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as NodeJS.ReadableStream;

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      console.error(`Failed to get file ${key}:`, error);
      throw error;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}