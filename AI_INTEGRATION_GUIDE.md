# AI Image Generation Integration Guide

This document describes the implementation of the free tier FLUX Schnell AI image generation system for Code Leonardo.

## Overview

The AI integration provides real image generation capabilities using FLUX.1 [schnell] model through Replicate API, replacing the mock generation system. The implementation follows a modular provider-based architecture that can be easily extended with additional AI services.

## Architecture

### Core Components

```
lib/ai-providers/
├── base-provider.ts          # Abstract base class and interfaces
├── flux-provider.ts          # FLUX.1 schnell implementation
├── provider-manager.ts       # Provider selection and management
├── types.ts                  # TypeScript type definitions
├── index.ts                  # Exported API
└── test-setup.ts            # Testing utilities

pages/api/
├── generate.ts              # Main generation endpoint
├── ai-status.ts             # System status endpoint
└── test-ai.ts              # Testing endpoint
```

### Flow Diagram

```
Frontend → /api/generate → FluxProvider → Replicate API → Generated Image → R2 Storage → Proxy URL → Frontend
```

## API Endpoints

### POST /api/generate

Generates an AI image based on uploaded file and selected style.

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "style": "ghibli|dragonball|pixel|oil|cartoon",
  "customPrompt": "optional custom prompt"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "generatedImageUrl": "https://app.com/api/files/sessions/...",
    "generatedFileName": "generated_ghibli_1234567890.png",
    "provider": "flux-schnell",
    "model": "black-forest-labs/flux-schnell",
    "cost": 0.003,
    "processingTimeMs": 15420,
    "style": "ghibli",
    "generatedAt": "2023-12-07T10:30:00.000Z"
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

### GET /api/ai-status

Returns system status and provider health information.

**Response:**
```json
{
  "timestamp": "2023-12-07T10:30:00.000Z",
  "status": "operational|degraded|error",
  "environment": {
    "replicateConfigured": true,
    "r2Configured": true,
    "appUrl": "http://localhost:3000"
  },
  "providers": {
    "total": 1,
    "healthy": 1,
    "details": [...]
  },
  "capabilities": {
    "availableStyles": ["ghibli", "dragonball", "pixel", "oil", "cartoon"],
    "supportedTiers": ["free"],
    "estimatedCosts": { "flux-schnell": "$0.003" }
  }
}
```

### GET /api/test-ai

Development endpoint for testing AI provider setup.

## Environment Configuration

### Required Variables

Add to `.env.local`:

```env
# AI Provider - Replicate API for FLUX
REPLICATE_API_TOKEN=r8_your_replicate_token_here

# Cloudflare R2 Storage (already configured)
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id

# Optional AI System Configuration
AI_MAX_DAILY_GENERATIONS=50
AI_MAX_MONTHLY_COST=10.00
AI_DEFAULT_TIMEOUT=120000
AI_ENABLE_FALLBACK=true
AI_LOG_LEVEL=info
```

### Getting Replicate API Token

1. Sign up at [replicate.com](https://replicate.com)
2. Go to Account Settings → API tokens
3. Create a new token
4. Add credits to your account (minimum $5-10 recommended)

## Cost Structure

### Free Tier Pricing

- **Model**: FLUX.1 [schnell]
- **Cost**: $0.003 per generation
- **Speed**: ~15 seconds average
- **Quality**: High quality, fast generation optimized for user onboarding

### Usage Estimates

- 100 generations = $0.30
- 1,000 generations = $3.00
- 10,000 generations = $30.00

## Supported Styles

| Style | Description | Prompt Template |
|-------|-------------|-----------------|
| `ghibli` | Studio Ghibli anime style | Hand-drawn animation, soft watercolor palette, dreamy atmosphere |
| `dragonball` | Dragon Ball anime style | Akira Toriyama art, dynamic poses, vibrant colors |
| `pixel` | 16-bit pixel art | Retro gaming graphics, crisp pixels, limited palette |
| `oil` | Classical oil painting | Renaissance technique, rich brushstrokes, painterly texture |
| `cartoon` | Western cartoon style | Bold outlines, bright colors, simplified character design |

## Integration Examples

### Frontend Usage

```typescript
// Generate image with selected style
const handleGenerate = async () => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'current-session-id',
      style: 'ghibli',
      customPrompt: 'optional custom prompt'
    })
  });
  
  const data = await response.json();
  if (data.success) {
    setResultImageUrl(data.data.generatedImageUrl);
  }
};
```

### Backend Provider Usage

```typescript
import { aiProviderManager } from '../lib/ai-providers';

// Generate image programmatically
const result = await aiProviderManager.generateImage({
  inputImageUrl: 'https://example.com/input.jpg',
  style: 'ghibli',
  sessionId: 'session-uuid',
  customPrompt: 'make it magical'
});
```

## Error Handling

### Common Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `AUTH_ERROR` | Invalid Replicate token | Check REPLICATE_API_TOKEN |
| `INSUFFICIENT_CREDITS` | No credits in Replicate account | Add credits to account |
| `RATE_LIMITED` | Too many requests | Wait and retry |
| `SERVICE_ERROR` | Replicate service down | Check status, retry later |
| `TIMEOUT` | Generation took too long | Retry with different parameters |

### Error Response Format

```json
{
  "success": false,
  "error": "User-friendly error message",
  "details": { /* Additional debug info in development */ }
}
```

## Testing

### Manual Testing

1. **Environment Test**: Visit `/api/test-ai` to check setup
2. **System Status**: Visit `/api/ai-status` for provider health
3. **End-to-End**: Upload image → Select style → Generate

### Automated Testing

```bash
# Test environment setup
curl http://localhost:3000/api/test-ai

# Test system status
curl http://localhost:3000/api/ai-status

# Test generation (after file upload)
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","style":"ghibli"}'
```

## Monitoring & Debugging

### Logs

The system provides comprehensive logging:

```javascript
// Console logs include:
🎨 Starting AI generation for style: ghibli
📝 FLUX prompt: Transform into Studio Ghibli anime style...
✅ FLUX generation completed in 15420ms
📊 AI System Status: operational (1/1 providers healthy)
```

### Performance Metrics

Each generation includes:
- Processing time (ms)
- Provider used
- Actual cost
- Success/failure status

## Future Extensions

### Adding New Providers

1. Create provider class extending `BaseAIProvider`
2. Implement required methods
3. Add to `AIProviderManager` constructor
4. Update environment variables

### Adding New Styles

1. Add style to `SUPPORTED_STYLES` array
2. Update prompt templates in providers
3. Add translations for style names/descriptions

## Security Considerations

### API Security

- All generated images stored in R2 with session isolation
- File access through proxy API with validation
- No direct external URL exposure
- Automatic session cleanup

### Cost Controls

- Per-request cost limits
- Daily/monthly usage tracking (ready for implementation)
- Provider fallback on failures
- Timeout protection

## Production Deployment

### Checklist

- [ ] Set REPLICATE_API_TOKEN in production environment
- [ ] Configure R2 storage in production
- [ ] Set up monitoring for API endpoints
- [ ] Configure log aggregation
- [ ] Set up cost alerts in Replicate dashboard
- [ ] Test end-to-end generation flow
- [ ] Configure backup providers (future)

### Scaling Considerations

- Current setup handles ~10 concurrent generations
- Replicate API has built-in scaling
- R2 storage scales automatically
- Consider Redis for provider health caching in high-traffic scenarios

## Troubleshooting

### Common Issues

**Generation fails with timeout:**
- Check network connectivity
- Verify Replicate API status
- Consider increasing timeout values

**High costs:**
- Monitor daily usage through logs
- Implement usage limits
- Check for stuck/retry loops

**Poor quality results:**
- Verify input image quality
- Test different style prompts
- Check FLUX model parameters

### Support Resources

- [Replicate Documentation](https://replicate.com/docs)
- [FLUX Model Details](https://replicate.com/black-forest-labs/flux-schnell)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

---

## Summary

This implementation provides a production-ready free tier AI image generation system with:

✅ Real FLUX.1 schnell AI generation  
✅ Session-based file management  
✅ Comprehensive error handling  
✅ Cost tracking and monitoring  
✅ Extensible provider architecture  
✅ Full TypeScript type safety  
✅ Integration with existing R2 storage  
✅ Proxy-based secure image serving  

The system is designed to handle real user traffic while maintaining cost control and providing excellent user experience through fast generation times and high-quality results.