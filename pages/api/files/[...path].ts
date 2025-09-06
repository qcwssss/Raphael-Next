import { NextApiRequest, NextApiResponse } from 'next';
import { CloudflareR2Storage } from '../../../lib/storage/cloudflare-r2';

const storage = new CloudflareR2Storage();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;
    
    if (!path || !Array.isArray(path)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Reconstruct the full path
    const fileKey = path.join('/');
    
    console.log(`📥 Serving file from R2: ${fileKey}`);
    
    // Check if file exists
    const exists = await storage.fileExists(fileKey);
    if (!exists) {
      console.log(`❌ File not found: ${fileKey}`);
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file from R2
    const fileBuffer = await storage.getFile(fileKey);
    
    // Determine content type based on file extension
    const extension = fileKey.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    console.log(`✅ Serving ${fileKey} (${fileBuffer.length} bytes, ${contentType})`);
    
    // Send the file
    res.send(fileBuffer);
  } catch (error) {
    console.error('❌ File serving error:', error);
    res.status(500).json({ 
      error: 'Failed to serve file',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}